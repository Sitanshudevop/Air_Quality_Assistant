// Debounce utility with timer cancellation for search input handling.

/** Extended function type carrying a cancel handle. */
export interface DebouncedFunction<Args extends readonly unknown[]> {
  (...args: Args): void;
  cancel(): void;
}

/**
 * Creates a debounced version of a function delayed by the specified duration.
 *
 * @param fn - Target function to debounce.
 * @param delayMs - Debounce delay in milliseconds, defaults to 300ms.
 * @returns Debounced wrapper function with cancel method.
 */
export function debounce<Args extends readonly unknown[]>(
  fn: (...args: Args) => void,
  delayMs = 300
): DebouncedFunction<Args> {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Args): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      fn(...args);
    }, delayMs);
  };

  debounced.cancel = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  return debounced;
}
