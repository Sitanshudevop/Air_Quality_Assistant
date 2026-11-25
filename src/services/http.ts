// Shared HTTP JSON fetch helper with AbortController timeout and signal chaining.

/**
 * Fetches JSON from a URL with timeout enforcement and optional caller cancellation.
 *
 * @param url - Target HTTP URL.
 * @param timeoutMs - Request timeout in milliseconds.
 * @param errorPrefix - Prefix for non-OK HTTP status errors.
 * @param signal - Optional external AbortSignal.
 * @returns Parsed JSON response payload.
 */
export async function fetchJsonWithTimeout<T>(
  url: string,
  timeoutMs: number,
  errorPrefix: string,
  signal?: AbortSignal
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const onCallerAbort = (): void => controller.abort();
  if (signal) signal.addEventListener('abort', onCallerAbort);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`${errorPrefix}: HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener('abort', onCallerAbort);
  }
}
