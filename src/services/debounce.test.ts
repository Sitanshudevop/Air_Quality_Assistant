// Unit tests for debounce utility function and cancellation handle.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce.js';

describe('Debounce Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution until delayMs has elapsed', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced('hello');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledWith('hello');
  });

  it('resets timer when called repeatedly within window', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced(1);
    vi.advanceTimersByTime(200);
    debounced(2);
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2);
  });

  it('cancels scheduled execution when cancel is called', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced('cancel me');
    debounced.cancel();

    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });

  it('does nothing when cancel is called without active timer', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);
    expect(() => debounced.cancel()).not.toThrow();
  });
});
