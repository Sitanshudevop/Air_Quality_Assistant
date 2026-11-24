// Unit tests for upstream Gemini client and fault tolerance.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeAiTask, extractJsonPayload } from './gemini.js';
import type { AiRequest } from '../shared/types.js';

describe('Gemini Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('extracts JSON from raw and markdown-wrapped text', () => {
    expect(extractJsonPayload('{"a":1}')).toEqual({ a: 1 });
    expect(extractJsonPayload('```json\n{"b":2}\n```')).toEqual({ b: 2 });
  });

  it('throws 503 when GEMINI_API_KEY is unset', async () => {
    delete process.env.GEMINI_API_KEY;
    const req: AiRequest = {
      task: 'indoor-tips',
      context: { aqi: 100, city: 'Delhi', facts: [] },
    };
    await expect(executeAiTask(req)).rejects.toMatchObject({ statusCode: 503 });
  });

  it('parses valid upstream response successfully', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const fakeResult = { tips: ['Keep closed'], urgency: 'high' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(fakeResult) }] } }],
      }),
    } as Response);

    const req: AiRequest = {
      task: 'indoor-tips',
      context: { aqi: 250, city: 'Delhi', facts: [] },
    };
    const { result, provenance } = await executeAiTask(req);
    expect(provenance.source).toBe('gemini');
    expect(provenance.model).toBe('gemini-2.5-flash');
    expect(result).toEqual(fakeResult);
  });

  it('validates narrate-plan, explain-impact, and community-message responses', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const planResult = { narrative: 'Plan', recommendations: ['Rec 1'] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(planResult) }] } }],
      }),
    } as Response);

    const res1 = await executeAiTask({
      task: 'narrate-plan',
      context: { aqi: 150, city: 'Delhi', facts: [] },
    });
    expect(res1.result).toEqual(planResult);

    const impactResult = { explanation: 'Exp', healthAdvice: 'Adv' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(impactResult) }] } }],
      }),
    } as Response);

    const res2 = await executeAiTask({
      task: 'explain-impact',
      context: { aqi: 180, city: 'Delhi', facts: [] },
    });
    expect(res2.result).toEqual(impactResult);

    const commResult = { message: 'Alert', urgency: 'high' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(commResult) }] } }],
      }),
    } as Response);

    const res3 = await executeAiTask({
      task: 'community-message',
      context: { aqi: 250, city: 'Delhi', facts: [] },
    });
    expect(res3.result).toEqual(commResult);
  });

  it('retries with fallback model when primary returns 429', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const fakeResult = { reply: 'Fallback chat reply' };
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: false, status: 429 } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(fakeResult) }] } }],
        }),
      } as Response);

    const req: AiRequest = {
      task: 'chat',
      context: { aqi: 200, city: 'Delhi', facts: [] },
      userText: 'Status?',
    };
    const { result, provenance } = await executeAiTask(req);
    expect(provenance.source).toBe('gemini');
    expect(provenance.model).toBe('gemini-1.5-flash');
    expect(result).toEqual(fakeResult);
  });

  it('falls back to rule-based generation on upstream error', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, status: 500 } as Response);

    const req: AiRequest = {
      task: 'indoor-tips',
      context: { aqi: 320, city: 'Delhi', facts: [] },
    };
    const { provenance } = await executeAiTask(req);
    expect(provenance.source).toBe('rules');
    expect(provenance.model).toBe('rules-v1');
  });

  it('throws 504 on abort timeout', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const controller = new AbortController();
    controller.abort();

    const req: AiRequest = {
      task: 'indoor-tips',
      context: { aqi: 150, city: 'Delhi', facts: [] },
    };
    await expect(executeAiTask(req, controller.signal)).rejects.toMatchObject({
      statusCode: 504,
    });
  });
});
