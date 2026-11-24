// Unit tests for sliding-window rate limiter.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlidingWindowRateLimiter } from './rate-limit.js';

describe('SlidingWindowRateLimiter', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within threshold and blocks excess', () => {
    const limiter = new SlidingWindowRateLimiter(2, 5000);
    const r1 = limiter.check('client-1');
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(1);

    const r2 = limiter.check('client-1');
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(0);

    const r3 = limiter.check('client-1');
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
    expect(r3.resetMs).toBeGreaterThan(0);
  });

  it('maintains independent quotas for distinct clients', () => {
    const limiter = new SlidingWindowRateLimiter(1, 5000);
    expect(limiter.check('ip-a').allowed).toBe(true);
    expect(limiter.check('ip-a').allowed).toBe(false);
    expect(limiter.check('ip-b').allowed).toBe(true);
  });

  it('resets quota after sliding window expires', () => {
    vi.useFakeTimers();
    const limiter = new SlidingWindowRateLimiter(1, 1000);
    expect(limiter.check('ip-c').allowed).toBe(true);
    expect(limiter.check('ip-c').allowed).toBe(false);

    vi.advanceTimersByTime(1100);
    expect(limiter.check('ip-c').allowed).toBe(true);
  });

  it('clears all recorded client timestamps on clear()', () => {
    const limiter = new SlidingWindowRateLimiter(1, 5000);
    limiter.check('ip-d');
    limiter.clear();
    expect(limiter.check('ip-d').allowed).toBe(true);
  });
});
