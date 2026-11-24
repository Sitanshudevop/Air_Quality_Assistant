// In-memory bounded LRU cache with time-to-live expiration for API responses.
import { CACHE_CONFIG } from '../src/constants/index.js';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * In-memory Least Recently Used (LRU) cache with TTL expiration.
 */
export class LruCache<T = unknown> {
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly map: Map<string, CacheEntry<T>>;

  /**
   * Initializes the LRU cache instance.
   *
   * @param maxEntries - Maximum number of entries before eviction.
   * @param ttlMs - Time to live in milliseconds.
   */
  public constructor(
    maxEntries: number = CACHE_CONFIG.MAX_ENTRIES,
    ttlMs: number = CACHE_CONFIG.TTL_MS
  ) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.map = new Map<string, CacheEntry<T>>();
  }

  /**
   * Retrieves an item from the cache if present and not expired.
   *
   * @param key - Cache lookup key.
   * @returns Cached value or null if missed or expired.
   */
  public get(key: string): T | null {
    const entry = this.map.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }
    // Refresh access order for LRU
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  /**
   * Stores an item in the cache with expiration.
   *
   * @param key - Cache storage key.
   * @param value - Value to store.
   */
  public set(key: string, value: T): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxEntries) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
    this.map.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /**
   * Clears all cache entries.
   */
  public clear(): void {
    this.map.clear();
  }

  /**
   * Gets current count of cached entries.
   *
   * @returns Active entry count.
   */
  public size(): number {
    return this.map.size;
  }
}

/** Default shared cache instance for AI proxy. */
export const defaultAiCache = new LruCache();
