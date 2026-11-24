// Unit tests for dual-tier in-memory and sessionStorage cache manager.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createCache,
  generateCacheKey,
  isSessionStorageAvailable,
} from './cache.js';

describe('Dual-Tier Cache Manager', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('generates normalized keys with 2-decimal rounded coordinates', () => {
    const key1 = generateCacheKey(28.6139, 77.209, 'aq_');
    const key2 = generateCacheKey(28.6141, 77.2089, 'aq_');
    expect(key1).toBe('aq_28.61_77.21');
    expect(key1).toBe(key2);
  });

  it('sets and retrieves items from L1 in-memory cache', () => {
    const cache = createCache<string>({ ttlMs: 5000, enableSessionStorage: false });
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.get('key1')).toBe('value1');
  });

  it('returns null on cache miss', () => {
    const cache = createCache<number>({ ttlMs: 5000 });
    expect(cache.get('missing')).toBeNull();
    expect(cache.has('missing')).toBe(false);
  });

  it('invalidates entries after TTL expiration', async () => {
    const cache = createCache<string>({ ttlMs: 20 });
    cache.set('staleKey', 'oldValue');
    expect(cache.get('staleKey')).toBe('oldValue');
    await new Promise((r) => setTimeout(r, 35));
    expect(cache.get('staleKey')).toBeNull();
  });

  it('persists and hydrates from sessionStorage L2 tier', () => {
    const cache = createCache<{ name: string }>({ ttlMs: 10000, prefix: 'aq_test_' });
    cache.set('loc1', { name: 'Delhi' });

    // Verify written to sessionStorage
    const raw = window.sessionStorage.getItem('aq_test_loc1');
    expect(raw).toBeTruthy();

    // Create fresh cache instance with same sessionStorage
    const cache2 = createCache<{ name: string }>({ ttlMs: 10000, prefix: 'aq_test_' });
    expect(cache2.get('loc1')).toEqual({ name: 'Delhi' });
  });

  it('handles expired sessionStorage entries gracefully', () => {
    const prefix = 'aq_exp_';
    window.sessionStorage.setItem(
      prefix + 'expiredKey',
      JSON.stringify({ value: 'stale', expiresAt: Date.now() - 1000, cachedAt: Date.now() - 2000 })
    );
    const cache = createCache<string>({ ttlMs: 10000, prefix });
    expect(cache.get('expiredKey')).toBeNull();
    expect(window.sessionStorage.getItem(prefix + 'expiredKey')).toBeNull();
  });

  it('safely recovers from corrupted JSON in sessionStorage', () => {
    const prefix = 'aq_corrupt_';
    window.sessionStorage.setItem(prefix + 'badJson', '{not valid json');
    const cache = createCache<string>({ ttlMs: 10000, prefix });
    expect(cache.get('badJson')).toBeNull();
  });

  it('deletes entries from both memory and sessionStorage', () => {
    const cache = createCache<string>({ ttlMs: 10000, prefix: 'aq_del_' });
    cache.set('delKey', 'toDelete');
    expect(cache.get('delKey')).toBe('toDelete');
    cache.delete('delKey');
    expect(cache.get('delKey')).toBeNull();
  });

  it('clears all prefixed entries across both tiers', () => {
    const cache = createCache<number>({ ttlMs: 10000, prefix: 'aq_clr_' });
    cache.set('k1', 10);
    cache.set('k2', 20);
    window.sessionStorage.setItem('unrelated_key', 'keep');

    cache.clear();
    expect(cache.get('k1')).toBeNull();
    expect(cache.get('k2')).toBeNull();
    expect(window.sessionStorage.getItem('unrelated_key')).toBe('keep');
  });

  it('gracefully degrades to memory on QuotaExceededError', () => {
    const originalSetItem = window.sessionStorage.setItem;
    vi.spyOn(window.sessionStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    const cache = createCache<string>({ ttlMs: 5000 });
    expect(() => cache.set('quotaKey', 'val')).not.toThrow();
    expect(cache.get('quotaKey')).toBe('val');

    window.sessionStorage.setItem = originalSetItem;
  });

  it('verifies sessionStorage availability check', () => {
    expect(isSessionStorageAvailable()).toBe(true);
  });
});
