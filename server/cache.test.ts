// Unit tests for in-memory LRU cache with TTL.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LruCache } from './cache.js';

describe('LruCache', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves cache entries', () => {
    const cache = new LruCache<string>(5, 10000);
    cache.set('key1', 'val1');
    expect(cache.get('key1')).toBe('val1');
    expect(cache.get('missing')).toBeNull();
    expect(cache.size()).toBe(1);
  });

  it('evicts expired items on lookup', () => {
    vi.useFakeTimers();
    const cache = new LruCache<string>(5, 1000);
    cache.set('temp', 'val');
    expect(cache.get('temp')).toBe('val');

    vi.advanceTimersByTime(1500);
    expect(cache.get('temp')).toBeNull();
    expect(cache.size()).toBe(0);
  });

  it('evicts least recently used item when capacity is exceeded', () => {
    const cache = new LruCache<number>(2, 10000);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.size()).toBe(2);

    // Access 'a' to make 'b' the oldest
    cache.get('a');
    cache.set('c', 3);

    expect(cache.get('b')).toBeNull();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
  });

  it('updates existing keys and clears all items', () => {
    const cache = new LruCache<string>(5, 10000);
    cache.set('k', 'v1');
    cache.set('k', 'v2');
    expect(cache.get('k')).toBe('v2');
    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get('k')).toBeNull();
  });
});
