// Unit tests for client AI proxy service, 12s timeout, and offline fallback.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAiResponse, checkAiStatus } from './ai.js';

describe('Client AI Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('checkAiStatus returns configured flag and falls back to false on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ configured: true }),
    } as Response);
    expect(await checkAiStatus()).toEqual({ configured: true });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    expect(await checkAiStatus()).toEqual({ configured: false });

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network down'));
    expect(await checkAiStatus()).toEqual({ configured: false });
  });

  it('getAiResponse returns live Gemini response when proxy succeeds', async () => {
    const serverPayload = {
      task: 'indoor-tips',
      result: { tips: ['Run HEPA purifier'], urgency: 'high' },
      provenance: { source: 'gemini', model: 'gemini-2.5-flash', cached: false, latencyMs: 120 },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => serverPayload,
    } as Response);

    const res = await getAiResponse({
      task: 'indoor-tips',
      context: { aqi: 300, city: 'Delhi', facts: [] },
    });
    expect(res).toEqual(serverPayload);
  });

  it('returns rules fallback immediately when offline without calling fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = await getAiResponse({ isOffline: true, task: 'indoor-tips' });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.provenance.source).toBe('rules');
    expect(res.result).toHaveProperty('tips');
  });

  it.each([
    'indoor-tips',
    'narrate-plan',
    'explain-impact',
    'community-message',
    'chat',
  ] as const)('falls back to domain rules for task "%s" on HTTP or network failure', async (task) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, status: 503 } as Response);
    const res = await getAiResponse({
      task,
      context: { aqi: 260, city: 'Lucknow', facts: [] },
    });
    expect(res.provenance.source).toBe('rules');
    expect(res.task).toBe(task);
  });

  it('falls back to rules when server payload fails schema validation or request times out', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: true }),
    } as Response);
    const badRes = await getAiResponse({ task: 'chat' });
    expect(badRes.provenance.source).toBe('rules');

    const controller = new AbortController();
    controller.abort();
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));
    const abortRes = await getAiResponse({ task: 'chat', signal: controller.signal });
    expect(abortRes.provenance.source).toBe('rules');
  });

  it('triggers 12s AbortController timeout and resolves with rules fallback', async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Timeout', 'AbortError')));
        })
    );

    const promise = getAiResponse({ task: 'chat' });
    await vi.advanceTimersByTimeAsync(12000);
    const res = await promise;
    expect(res.provenance.source).toBe('rules');
  });
});
