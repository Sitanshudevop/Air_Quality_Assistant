// Integration and unit tests for AI proxy API endpoint, bounded reading, safety, and caching.
// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from './ai.js';
import type { ApiErrorResponse, AiResponse } from '../shared/types.js';
import { defaultAiCache } from '../server/cache.js';
import { defaultRateLimiter } from '../server/rate-limit.js';

function mockGeminiJson(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
    }),
  } as Response;
}

describe('AI Proxy API Endpoint', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    defaultAiCache.clear();
    defaultRateLimiter.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects GET requests with 405 Method Not Allowed', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('rejects oversized payloads via header or streaming body without Content-Length with 413', async () => {
    const reqHeader = new Request('http://localhost/api/ai', {
      method: 'POST',
      headers: { 'content-length': '70000' },
      body: JSON.stringify({}),
    });
    expect((await POST(reqHeader)).status).toBe(413);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(70000).fill(65));
        controller.close();
      },
    });
    const reqStream = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: stream,
      duplex: 'half',
    } as RequestInit);
    expect((await POST(reqStream)).status).toBe(413);
  });

  it('rejects invalid JSON and invalid schema with 400 Invalid request payload', async () => {
    const reqBadJson = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: 'invalid json{',
    });
    const res1 = await POST(reqBadJson);
    expect(res1.status).toBe(400);
    expect(((await res1.json()) as ApiErrorResponse).error).toBe('Invalid request payload');

    const reqBadSchema = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: JSON.stringify({ task: 'non-existent-task' }),
    });
    const res2 = await POST(reqBadSchema);
    expect(res2.status).toBe(400);
    expect(((await res2.json()) as ApiErrorResponse).error).toBe('Invalid request payload');
  });

  it('returns 503 when GEMINI_API_KEY is not configured', async () => {
    delete process.env.GEMINI_API_KEY;
    const req = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: JSON.stringify({
        task: 'indoor-tips',
        context: { aqi: 220, city: 'Delhi', facts: [] },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const json = (await res.json()) as ApiErrorResponse;
    expect(json.error).toBe('AI service not configured');
  });

  it('executes valid task and returns 200 with provenance and normalized cache hit', async () => {
    process.env.GEMINI_API_KEY = 'valid-key-secret-value';
    const fakeTips = { tips: ['Keep windows sealed'], urgency: 'high' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockGeminiJson(fakeTips));

    const payload1 = {
      task: 'indoor-tips',
      context: { aqi: 240, city: 'Delhi', facts: ['PM2.5 spike'], pollutants: { pm25: 180 } },
      userText: '  Indoor advice  ',
    };
    const res1 = await POST(new Request('http://localhost/api/ai', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.1' },
      body: JSON.stringify(payload1),
    }));
    expect(res1.status).toBe(200);
    const json1 = (await res1.json()) as AiResponse;
    expect(json1.provenance.source).toBe('gemini');
    expect(json1.provenance.cached).toBe(false);

    // Normalized casing/whitespace hits cache
    const payload2 = {
      task: 'indoor-tips',
      context: { aqi: 240, city: ' delhi ', facts: ['PM2.5 spike'], pollutants: { pm25: 180 } },
      userText: 'indoor advice',
    };
    const res2 = await POST(new Request('http://localhost/api/ai', {
      method: 'POST',
      headers: { 'x-real-ip': '192.168.1.1' },
      body: JSON.stringify(payload2),
    }));
    const json2 = (await res2.json()) as AiResponse;
    expect(json2.provenance.cached).toBe(true);
  });

  it('differentiates cache by facts, pollutants, and userPreferences', async () => {
    process.env.GEMINI_API_KEY = 'valid-key';
    const fakeTips1 = { tips: ['Keep windows sealed'], urgency: 'high' };
    const fakeTips2 = { tips: ['Open windows for ventilation'], urgency: 'low' };
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockGeminiJson(fakeTips1))
      .mockResolvedValueOnce(mockGeminiJson(fakeTips2));

    const res1 = await POST(new Request('http://localhost/api/ai', {
      method: 'POST',
      body: JSON.stringify({
        task: 'indoor-tips',
        context: { aqi: 240, city: 'Delhi', facts: ['Smog alert'], pollutants: { pm25: 180 }, userPreferences: { hasChild: true } },
      }),
    }));
    expect(((await res1.json()) as AiResponse).provenance.cached).toBe(false);

    const res2 = await POST(new Request('http://localhost/api/ai', {
      method: 'POST',
      body: JSON.stringify({
        task: 'indoor-tips',
        context: { aqi: 240, city: 'Delhi', facts: ['Smog alert'], pollutants: { pm25: 90 }, userPreferences: { hasChild: false } },
      }),
    }));
    expect(((await res2.json()) as AiResponse).provenance.cached).toBe(false);
  });

  it('does not cache transient rules fallbacks from Gemini errors', async () => {
    process.env.GEMINI_API_KEY = 'valid-key';
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response)
      .mockResolvedValueOnce(mockGeminiJson({ tips: ['Recovered from Gemini'], urgency: 'high' }));

    const body = JSON.stringify({ task: 'indoor-tips', context: { aqi: 300, city: 'Delhi', facts: [] } });
    const res1 = await POST(new Request('http://localhost/api/ai', { method: 'POST', body }));
    const json1 = (await res1.json()) as AiResponse;
    expect(json1.provenance.source).toBe('rules');
    expect(json1.provenance.cached).toBe(false);

    // Retry should hit Gemini again instead of serving cached fallback
    const res2 = await POST(new Request('http://localhost/api/ai', { method: 'POST', body }));
    const json2 = (await res2.json()) as AiResponse;
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(json2.provenance.source).toBe('gemini');
  });

  it('caches non-transient 400 invalid-key rules fallback for identical repeat calls', async () => {
    process.env.GEMINI_API_KEY = 'bad-key';
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, status: 400 } as Response);

    const body = JSON.stringify({ task: 'indoor-tips', context: { aqi: 280, city: 'Noida', facts: [] } });
    const res1 = await POST(new Request('http://localhost/api/ai', { method: 'POST', body }));
    expect(((await res1.json()) as AiResponse).provenance.cached).toBe(false);

    const res2 = await POST(new Request('http://localhost/api/ai', { method: 'POST', body }));
    expect(((await res2.json()) as AiResponse).provenance.cached).toBe(true);
  });

  it('intercepts safety-blocked prompts without calling Gemini and caches deterministic safety reply', async () => {
    delete process.env.GEMINI_API_KEY;
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const body = JSON.stringify({
      task: 'chat',
      context: { aqi: 350, city: 'Delhi', facts: [] },
      userText: 'Severe chest pain and difficulty breathing',
    });

    const res1 = await POST(new Request('http://localhost/api/ai', { method: 'POST', body }));
    expect(res1.status).toBe(200);
    const json1 = (await res1.json()) as AiResponse;
    expect(json1.provenance.source).toBe('rules');
    expect(fetchSpy).not.toHaveBeenCalled();

    const res2 = await POST(new Request('http://localhost/api/ai', { method: 'POST', body }));
    expect(((await res2.json()) as AiResponse).provenance.cached).toBe(true);
  });

  it('enforces rate limiting returning 429', async () => {
    const payload = JSON.stringify({ task: 'indoor-tips', context: { aqi: 100, city: 'Delhi', facts: [] } });
    for (let i = 0; i < 30; i++) defaultRateLimiter.check('10.0.0.1');
    const res = await POST(new Request('http://localhost/api/ai', {
      method: 'POST',
      headers: { 'x-real-ip': '10.0.0.1' },
      body: payload,
    }));
    expect(res.status).toBe(429);
  });

  it('returns generic 500 error on unexpected internal failure without secret leakage', async () => {
    process.env.GEMINI_API_KEY = 'AIzaSyFakeSecretDoNotLeak123456789012345';
    const brokenReq = {
      headers: new Headers(),
      body: null,
      text: async () => {
        throw new Error('Internal failure involving AIzaSyFakeSecretDoNotLeak123456789012345');
      },
    } as unknown as Request;

    const res = await POST(brokenReq);
    expect(res.status).toBe(500);
    const raw = await res.text();
    expect(JSON.parse(raw)).toEqual({ error: 'Internal server error' });
    expect(raw).not.toContain('AIzaSy');
  });
});
