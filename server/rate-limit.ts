// Per-instance sliding-window rate limiter with bounded client tracking.
// Note: State is per serverless instance; cold starts or scaled replicas do not share quotas.
import { RATE_LIMIT_CONFIG } from '../src/constants/index.js';

/** Default maximum distinct clients tracked concurrently per instance. */
const MAX_RATE_LIMIT_CLIENTS = 1000;

/** Rate limit check result. */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/** Per-instance sliding-window in-memory rate limiter with bounded client map. */
export class SlidingWindowRateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly maxClients: number;
  private readonly clientTimestamps: Map<string, number[]>;

  /**
   * Initializes a per-instance rate limiter.
   *
   * @param maxRequests - Maximum allowed requests in window.
   * @param windowMs - Sliding window duration in milliseconds.
   * @param maxClients - Maximum distinct client entries stored before eviction.
   */
  public constructor(
    maxRequests: number = RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW,
    windowMs: number = RATE_LIMIT_CONFIG.WINDOW_MS,
    maxClients: number = MAX_RATE_LIMIT_CLIENTS
  ) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.maxClients = Math.max(1, maxClients);
    this.clientTimestamps = new Map<string, number[]>();
  }

  /** Sweeps expired client buckets and evicts oldest entries if capacity is reached. */
  private ensureCapacity(clientId: string, windowStart: number): void {
    if (this.clientTimestamps.has(clientId) || this.clientTimestamps.size < this.maxClients) {
      return;
    }
    for (const [id, times] of this.clientTimestamps.entries()) {
      const latest = times[times.length - 1] ?? 0;
      if (latest <= windowStart) {
        this.clientTimestamps.delete(id);
      }
    }
    if (this.clientTimestamps.size >= this.maxClients) {
      const oldestKey = this.clientTimestamps.keys().next().value;
      if (oldestKey !== undefined) {
        this.clientTimestamps.delete(oldestKey);
      }
    }
  }

  /**
   * Checks whether a request for a client identifier is allowed within this instance's window.
   *
   * @param clientId - Unique client IP or identifier.
   * @returns Rate limit outcome with remaining quota.
   */
  public check(clientId: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    this.ensureCapacity(clientId, windowStart);

    const existing = this.clientTimestamps.get(clientId) ?? [];
    const timestamps = existing.filter((t) => t > windowStart);

    if (timestamps.length >= this.maxRequests) {
      const oldest = timestamps[0] ?? now;
      const resetMs = Math.max(0, oldest + this.windowMs - now);
      return { allowed: false, remaining: 0, resetMs };
    }

    timestamps.push(now);
    this.clientTimestamps.delete(clientId);
    this.clientTimestamps.set(clientId, timestamps);
    return {
      allowed: true,
      remaining: this.maxRequests - timestamps.length,
      resetMs: this.windowMs,
    };
  }

  /**
   * Returns current number of tracked client buckets in this instance.
   *
   * @returns Tracked client count.
   */
  public clientCount(): number {
    return this.clientTimestamps.size;
  }

  /**
   * Clears all recorded request timestamps.
   */
  public clear(): void {
    this.clientTimestamps.clear();
  }
}

/** Default shared per-instance rate limiter. */
export const defaultRateLimiter = new SlidingWindowRateLimiter();
