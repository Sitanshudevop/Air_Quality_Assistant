// Chaos and tampered-storage resilience tests for profile, chat, manualReading, and cache storage.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  clearProfile,
  DEFAULT_PROFILE,
  getProfile,
  migrateProfile,
  normalizeProfile,
  PROFILE_STORAGE_KEY,
  profileSchema,
} from './profile.js';
import {
  CHAT_STORAGE_KEY,
  clearChatHistory,
  loadChatHistory,
  saveChatHistory,
} from '../features/assistant/chatUtils.js';
import {
  clearManualReading,
  createManualReading,
  getManualReading,
  saveManualReading,
} from './manualReading.js';
import { createCache, isSessionStorageAvailable } from './cache.js';

describe('Storage Chaos Resilience (Profile, Chat, Manual, Cache)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearProfile();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('prevents __proto__ pollution and recovers on unknown version or wrong profile types', () => {
    const protoPayload = '{"__proto__":{"polluted":true},"cityName":"Delhi"}';
    window.localStorage.setItem(PROFILE_STORAGE_KEY, protoPayload);
    const prof = getProfile();
    expect(prof.cityName).toBe('Delhi');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();

    expect(profileSchema.safeParse({ version: 999 }).success).toBe(false);
    const invalidRaw = [
      '[]',
      'null',
      '123',
      'true',
      JSON.stringify({ hasPurifier: 'yes', cookingFuel: 'wood', commuteDistanceKm: 'far' }),
    ];
    for (const raw of invalidRaw) {
      clearProfile();
      window.localStorage.setItem(PROFILE_STORAGE_KEY, raw);
      expect(getProfile().cityName).toBe(DEFAULT_PROFILE.cityName);
      expect(window.localStorage.getItem(PROFILE_STORAGE_KEY)).toBeNull();
    }
  });

  it('recovers empty {} profile, clamps out-of-range numbers, and handles cold read / getItem throw', () => {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, '{}');
    expect(getProfile().cityName).toBe(DEFAULT_PROFILE.cityName);
    expect(profileSchema.safeParse({}).success).toBe(true);
    expect(migrateProfile({}).cityName).toBe(DEFAULT_PROFILE.cityName);
    expect(migrateProfile(null)).toEqual(DEFAULT_PROFILE);
    expect(normalizeProfile(null)).toEqual(DEFAULT_PROFILE);
    expect(normalizeProfile({ commuteDistanceKm: 1e9, householdMembers: 999 })).toMatchObject({
      commuteDistanceKm: 100,
      householdMembers: 20,
    });

    clearProfile();
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...DEFAULT_PROFILE, cityName: 'Pune' }));
    expect(getProfile().cityName).toBe('Pune');

    clearProfile();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(getProfile()).toEqual(DEFAULT_PROFILE);
  });

  it('resists tampered chat history payloads and localStorage quota/remove throws', () => {
    const protoChat = '[{"__proto__":{"polluted":true},"id":"1","role":"user","text":"hi"}]';
    window.localStorage.setItem(CHAT_STORAGE_KEY, protoChat);
    expect(loadChatHistory()).toHaveLength(1);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();

    const badPayloads = [
      'null',
      '123',
      '{"id":"1"}',
      JSON.stringify([{ id: 123, role: 'user', text: null }]),
      JSON.stringify([{ id: '1', role: 'user', text: 'x', isSafetyCard: 'true' }]),
      JSON.stringify([{ id: '1', role: 'user', text: 'x', suggestedActions: Array(11).fill('a') }]),
      JSON.stringify([{ id: '1', role: 'user', text: 'a'.repeat(4001) }]),
      JSON.stringify([{ id: 'x'.repeat(65), role: 'user', text: 'ok' }]),
      JSON.stringify([{ id: '1', role: 'user', text: '' }]),
    ];
    for (const payload of badPayloads) {
      window.localStorage.setItem(CHAT_STORAGE_KEY, payload);
      expect(loadChatHistory()).toEqual([]);
      expect(window.localStorage.getItem(CHAT_STORAGE_KEY)).toBeNull();
    }

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    expect(() => saveChatHistory([{ id: '1', role: 'user', text: 'hello' }])).not.toThrow();
    expect(() => clearChatHistory()).not.toThrow();
  });

  it('resists tampered manual readings and sessionStorage errors', () => {
    const protoManual = JSON.stringify({
      ...createManualReading({ aqi: 180, cityName: 'Delhi' }),
      __proto__: { polluted: true },
    });
    window.sessionStorage.setItem('saans_manual_reading', protoManual);
    expect(getManualReading()?.aqi).toBe(180);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();

    const invalidManuals = [
      '[]',
      'null',
      JSON.stringify({ aqi: '100', pm25: 50 }),
      JSON.stringify({ ...createManualReading({ aqi: 100 }), aqi: -1 }),
      JSON.stringify({ ...createManualReading({ aqi: 100 }), aqi: 501 }),
      JSON.stringify({ ...createManualReading({ aqi: 100 }), source: 'open-meteo' }),
      JSON.stringify({ ...createManualReading({ aqi: 100 }), cityName: 'x'.repeat(101) }),
    ];
    for (const bad of invalidManuals) {
      clearManualReading();
      window.sessionStorage.setItem('saans_manual_reading', bad);
      expect(getManualReading()).toBeNull();
      expect(window.sessionStorage.getItem('saans_manual_reading')).toBeNull();
    }

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    expect(() => saveManualReading(createManualReading({ aqi: 150 }))).not.toThrow();
    expect(() => clearManualReading()).not.toThrow();
  });

  it('rejects tampered cache envelopes, preserves L2 TTL on L1 hydration, and handles disabled sessionStorage', () => {
    const prefix = 'aq_chaos_';
    for (const bad of ['[]', 'null', JSON.stringify({ value: 'ok', expiresAt: -1, cachedAt: 0 })]) {
      window.sessionStorage.setItem(prefix + 'k', bad);
      const c = createCache<string>({ ttlMs: 10000, prefix });
      expect(c.get('k')).toBeNull();
      expect(window.sessionStorage.getItem(prefix + 'k')).toBeNull();
    }

    vi.useFakeTimers();
    const now = Date.now();
    window.sessionStorage.setItem(
      'aq_ttl_k1',
      JSON.stringify({ value: 'persisted', expiresAt: now + 500, cachedAt: now })
    );
    const cache = createCache<string>({ ttlMs: 60000, prefix: 'aq_ttl_' });
    expect(cache.get('k1')).toBe('persisted');
    vi.advanceTimersByTime(600);
    expect(cache.get('k1')).toBeNull();

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });
    expect(isSessionStorageAvailable()).toBe(false);
  });
});
