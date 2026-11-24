// Integration and unit tests for AI proxy API endpoint.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from './ai.js';
import type { ApiErrorResponse, AiResponse } from '../shared/types.js';
import { defaultAiCache } from '../server/cache.js';
import { defaultRateLimiter } from '../server/rate-limit.js';

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

  it('rejects oversized payloads with 413 Payload Too Large', async () => {
    const req = new Request('http://localhost/api/ai', {
      method: 'POST',
      headers: { 'content-length': '70000' },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('rejects invalid JSON with 400 Bad Request', async () => {
    const req = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: 'invalid json{',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid schema with 400 Bad Request', async () => {
    const req = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: JSON.stringify({ task: 'non-existent-task' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
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

  it('executes valid task and returns 200 with provenance and cache hit', async () => {
    process.env.GEMINI_API_KEY = 'valid-key';
    const fakeTips = { tips: ['Keep windows sealed'], urgency: 'high' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(fakeTips) }] } }],
      }),
    } as Response);

    const payload = {
      task: 'indoor-tips',
      context: { aqi: 240, city: 'Delhi', facts: ['PM2.5 spike'] },
    };
    const req1 = new Request('http://localhost/api/ai', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.1' },
      body: JSON.stringify(payload),
    });

    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    const json1 = (await res1.json()) as AiResponse;
    expect(json1.provenance.source).toBe('gemini');
    expect(json1.provenance.cached).toBe(false);

    // Second identical request hits LRU cache
    const req2 = new Request('http://localhost/api/ai', {
      method: 'POST',
      headers: { 'x-real-ip': '192.168.1.1' },
      body: JSON.stringify(payload),
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    const json2 = (await res2.json()) as AiResponse;
    expect(json2.provenance.cached).toBe(true);
  });

  it('enforces rate limiting returning 429', async () => {
    const payload = JSON.stringify({
      task: 'indoor-tips',
      context: { aqi: 100, city: 'Delhi', facts: [] },
    });
    // Exhaust rate limit
    for (let i = 0; i < 30; i++) {
      defaultRateLimiter.check('10.0.0.1');
    }
    const req = new Request('http://localhost/api/ai', {
      method: 'POST',
      headers: { 'x-real-ip': '10.0.0.1' },
      body: payload,
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
