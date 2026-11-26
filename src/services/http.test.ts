// Unit tests for fetchJsonWithTimeout covering success, HTTP errors, timeouts, and AbortSignal chaining.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchJsonWithTimeout } from './http.js';

describe('fetchJsonWithTimeout', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns parsed JSON on successful response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', count: 42 }),
    } as Response);

    const data = await fetchJsonWithTimeout<{ status: string; count: number }>(
      'https://example.com/api',
      5000,
      'Test error'
    );
    expect(data).toEqual({ status: 'ok', count: 42 });
  });

  it('throws prefixed error when HTTP response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response);

    await expect(
      fetchJsonWithTimeout('https://example.com/api', 5000, 'Upstream failure')
    ).rejects.toThrow('Upstream failure: HTTP 503');
  });

  it('aborts request when timeoutMs elapses', async () => {
    vi.useFakeTimers();
    let capturedSignal: AbortSignal | undefined;
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      capturedSignal = init?.signal ?? undefined;
      return new Promise((_resolve, reject) => {
        capturedSignal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });

    const promise = fetchJsonWithTimeout('https://example.com/slow', 250, 'Timeout test');
    const assertion = expect(promise).rejects.toThrow('Aborted');
    await vi.advanceTimersByTimeAsync(250);
    await assertion;
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('aborts immediately when caller signal is already aborted and cleans up listener', async () => {
    const caller = new AbortController();
    caller.abort();
    const removeSpy = vi.spyOn(caller.signal, 'removeEventListener');
    let capturedSignal: AbortSignal | undefined;

    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      capturedSignal = init?.signal ?? undefined;
      return Promise.reject(new DOMException('Aborted', 'AbortError'));
    });

    await expect(
      fetchJsonWithTimeout('https://example.com/aborted', 5000, 'Abort test', caller.signal)
    ).rejects.toThrow('Aborted');
    expect(capturedSignal?.aborted).toBe(true);
    expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('chains in-flight caller abort and removes abort listener on completion', async () => {
    const caller = new AbortController();
    const removeSpy = vi.spyOn(caller.signal, 'removeEventListener');
    let capturedSignal: AbortSignal | undefined;

    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      capturedSignal = init?.signal ?? undefined;
      return new Promise((_resolve, reject) => {
        capturedSignal?.addEventListener('abort', () => {
          reject(new DOMException('Cancelled by caller', 'AbortError'));
        });
      });
    });

    const promise = fetchJsonWithTimeout('https://example.com/live', 5000, 'Cancel test', caller.signal);
    caller.abort();
    await expect(promise).rejects.toThrow('Cancelled by caller');
    expect(capturedSignal?.aborted).toBe(true);
    expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));
  });
});
