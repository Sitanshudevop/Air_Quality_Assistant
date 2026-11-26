// Dual-tier in-memory and sessionStorage cache with TTL and quota resilience.
import { CACHE_CONFIG } from '../constants/index.js';
import { getErrorMessage } from '../utils/error.js';
import { logError } from '../utils/logger.js';
import {
  storageEnvelopeSchema,
  type CacheEntry,
  type StorageEnvelope,
  type CacheOptions,
  type CacheInstance,
} from './cache.types.js';

const DEFAULT_TTL_MS = CACHE_CONFIG.TTL_MS;
const DEFAULT_PREFIX = 'aq_';

/**
 * Checks whether browser sessionStorage is functional and accessible.
 *
 * @returns True if sessionStorage can be read and written to safely.
 */
export function isSessionStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return false;
    const testKey = '__saans_stg_test__';
    window.sessionStorage.setItem(testKey, '1');
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates a normalized cache key with coordinates rounded to 2 decimal places.
 *
 * @param lat - Latitude coordinate.
 * @param lon - Long longitude coordinate.
 * @param prefix - Prefix to prevent key collisions, defaults to 'aq_'.
 * @returns Formatted cache key string.
 */
export function generateCacheKey(
  lat: number,
  lon: number,
  prefix = DEFAULT_PREFIX
): string {
  const roundedLat = (Math.round(lat * 100) / 100).toFixed(2);
  const roundedLon = (Math.round(lon * 100) / 100).toFixed(2);
  return `${prefix}${roundedLat}_${roundedLon}`;
}

/**
 * Reads envelope from sessionStorage if present and unexpired.
 *
 * @param fullKey - Storage key with prefix.
 * @returns Stored value or null if absent, corrupted, or expired.
 */
function readSessionStorage<T>(fullKey: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(fullKey);
    if (!raw) return null;
    const parsed = storageEnvelopeSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || Date.now() >= parsed.data.expiresAt) {
      if (!parsed.success) {
        logError('Invalid cache envelope removed from sessionStorage', {
          action: 'readSessionStorage',
          error: parsed.error.message,
        });
      }
      window.sessionStorage.removeItem(fullKey);
      return null;
    }
    return parsed.data.value as T;
  } catch (err) {
    logError('Failed to parse cache entry from sessionStorage', {
      action: 'readSessionStorage',
      error: getErrorMessage(err),
    });
    try { window.sessionStorage.removeItem(fullKey); } catch { /* ignore */ }
    return null;
  }
}

/**
 * Writes envelope to sessionStorage handling QuotaExceededError gracefully.
 *
 * @param fullKey - Storage key with prefix.
 * @param envelope - Envelope containing value and expiration.
 */
function writeSessionStorage<T>(
  fullKey: string,
  envelope: StorageEnvelope<T>
): void {
  try {
    window.sessionStorage.setItem(fullKey, JSON.stringify(envelope));
  } catch (err) {
    logError('Failed writing cache entry to sessionStorage', {
      action: 'writeSessionStorage',
      error: getErrorMessage(err),
    });
  }
}

/**
 * Clears prefixed keys from sessionStorage.
 *
 * @param prefix - Storage key prefix.
 */
function clearSessionStorage(prefix: string): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i);
      if (k?.startsWith(prefix)) keysToRemove.push(k);
    }
    for (const k of keysToRemove) window.sessionStorage.removeItem(k);
  } catch {
    // ignore
  }
}

interface CacheContext<T> {
  readonly memoryMap: Map<string, CacheEntry<T>>;
  readonly hasSession: boolean;
  readonly prefix: string;
  readonly ttlMs: number;
}

/** Resolves cache get request checking L1 memory and L2 sessionStorage. */
function resolveCacheGet<T>(key: string, ctx: CacheContext<T>): T | null {
  const mem = ctx.memoryMap.get(key);
  if (mem) {
    if (Date.now() < mem.expiresAt) return mem.value;
    ctx.memoryMap.delete(key);
  }
  if (!ctx.hasSession) return null;
  const sessionVal = readSessionStorage<T>(ctx.prefix + key);
  if (sessionVal !== null) {
    ctx.memoryMap.set(key, { value: sessionVal, expiresAt: Date.now() + ctx.ttlMs });
    return sessionVal;
  }
  return null;
}

/**
 * Creates a dual-tier cache instance with in-memory L1 and sessionStorage L2.
 *
 * @param options - Cache configuration options.
 * @returns CacheInstance interface.
 */
export function createCache<T>(options?: CacheOptions): CacheInstance<T> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const enableSession = options?.enableSessionStorage ?? true;
  const prefix = options?.prefix ?? DEFAULT_PREFIX;
  const memoryMap = new Map<string, CacheEntry<T>>();
  const hasSession = enableSession && isSessionStorageAvailable();
  const ctx: CacheContext<T> = { memoryMap, hasSession, prefix, ttlMs };

  return {
    get: (key: string): T | null => resolveCacheGet(key, ctx),
    set(key: string, value: T, ttlOverrideMs?: number): void {
      const expiresAt = Date.now() + (ttlOverrideMs ?? ttlMs);
      memoryMap.set(key, { value, expiresAt });
      if (hasSession) {
        writeSessionStorage(prefix + key, { value, expiresAt, cachedAt: Date.now() });
      }
    },
    delete(key: string): void {
      memoryMap.delete(key);
      if (hasSession) {
        try { window.sessionStorage.removeItem(prefix + key); } catch { /* ignore */ }
      }
    },
    clear(): void {
      memoryMap.clear();
      if (hasSession) clearSessionStorage(prefix);
    },
    has(key: string): boolean {
      return this.get(key) !== null;
    },
  };
}

/** Global default cache instance for air quality data. */
export const defaultAirQualityCache = createCache<unknown>({
  ttlMs: DEFAULT_TTL_MS,
  prefix: DEFAULT_PREFIX,
});
