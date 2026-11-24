// Type definitions for dual-tier in-memory and sessionStorage cache.

/** In-memory cache entry with expiration timestamp. */
export interface CacheEntry<T> {
  readonly value: T;
  readonly expiresAt: number;
}

/** Storage envelope saved to sessionStorage with metadata. */
export interface StorageEnvelope<T> {
  readonly value: T;
  readonly expiresAt: number;
  readonly cachedAt: number;
}

/** Configuration options for initializing a cache instance. */
export interface CacheOptions {
  readonly ttlMs?: number;
  readonly enableSessionStorage?: boolean;
  readonly prefix?: string;
}

/** Unified cache interface supporting in-memory and session tiers. */
export interface CacheInstance<T> {
  get(key: string): T | null;
  set(key: string, value: T, ttlOverrideMs?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
}
