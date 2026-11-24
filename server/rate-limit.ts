// Per-instance sliding-window rate limiter for serverless endpoints.
import { RATE_LIMIT_CONFIG } from '../src/constants/index.js';

/** Rate limit check result. */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/** Sliding-window in-memory rate limiter. */
export class SlidingWindowRateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly clientTimestamps: Map<string, number[]>;

  /**
   * Initializes rate limiter instance.
   *
   * @param maxRequests - Maximum allowed requests in window.
   * @param windowMs - Sliding window duration in milliseconds.
   */
  public constructor(
    maxRequests: number = RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW,
    windowMs: number = RATE_LIMIT_CONFIG.WINDOW_MS
  ) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.clientTimestamps = new Map<string, number[]>();
  }

  /**
   * Checks whether a request for a client identifier is allowed.
   *
   * @param clientId - Unique client IP or identifier.
   * @returns Rate limit outcome with remaining quota.
   */
  public check(clientId: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = (this.clientTimestamps.get(clientId) ?? []).filter((t) => t > windowStart);

    if (timestamps.length >= this.maxRequests) {
      const oldest = timestamps[0] ?? now;
      const resetMs = Math.max(0, oldest + this.windowMs - now);
      return { allowed: false, remaining: 0, resetMs };
    }

    timestamps.push(now);
    this.clientTimestamps.set(clientId, timestamps);
    return {
      allowed: true,
      remaining: this.maxRequests - timestamps.length,
      resetMs: this.windowMs,
    };
  }

  /**
   * Clears all recorded request timestamps.
   */
  public clear(): void {
    this.clientTimestamps.clear();
  }
}

/** Default shared rate limiter instance. */
export const defaultRateLimiter = new SlidingWindowRateLimiter();
