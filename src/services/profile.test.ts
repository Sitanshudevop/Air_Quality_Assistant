// Unit tests for user profile storage, schema validation, migration, and sanitization.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DEFAULT_PROFILE,
  PROFILE_SCHEMA_VERSION,
  PROFILE_STORAGE_KEY,
  clearProfile,
  getProfile,
  migrateProfile,
  normalizeProfile,
  parseProfile,
  profileSchema,
  saveProfile,
} from './profile.js';

describe('User Profile Storage and Versioning', () => {
  beforeEach(() => {
    clearProfile();
  });

  it('exposes expected schema version metadata and default profile', () => {
    expect(PROFILE_SCHEMA_VERSION).toBe(1);
    expect(DEFAULT_PROFILE.version).toBe(1);
    expect(DEFAULT_PROFILE.cityName).toBe('Delhi');
    expect(DEFAULT_PROFILE.commuteDistanceKm).toBe(10);
  });

  it('validates profile objects using profileSchema', () => {
    expect(profileSchema.safeParse(DEFAULT_PROFILE).success).toBe(true);
    expect(profileSchema.safeParse({ cityName: '' }).success).toBe(false);
  });

  it('clamps numerical boundaries on commute distance and household size', () => {
    const normalized = normalizeProfile({ commuteDistanceKm: -15, householdMembers: -5 });
    expect(normalized.commuteDistanceKm).toBe(0);
    expect(normalized.householdMembers).toBe(1);
  });

  it('migrates legacy v0 profiles with legacy property names', () => {
    const legacy = { version: 0, city: 'Lucknow', commuteMode: 'car' };
    const migrated = migrateProfile(legacy);
    expect(migrated.version).toBe(1);
    expect(migrated.cityName).toBe('Lucknow');
    expect(migrated.commuteMode).toBe('car');
  });

  it('safely recovers to DEFAULT_PROFILE on corrupted JSON string', () => {
    const corrupted = 'invalid-json{{{';
    const profile = parseProfile(corrupted);
    expect(profile).toBeDefined();
    expect(profile.cityName).toBe(DEFAULT_PROFILE.cityName);
  });

  it('persists and retrieves profile preferences in localStorage', () => {
    const saved = saveProfile({ cityName: 'Mumbai', commuteDistanceKm: 25 });
    expect(saved.cityName).toBe('Mumbai');
    expect(saved.commuteDistanceKm).toBe(25);

    const retrieved = getProfile();
    expect(retrieved.cityName).toBe('Mumbai');
    expect(retrieved.commuteDistanceKm).toBe(25);
  });

  it('degrades gracefully without throwing when localStorage quota is exceeded', () => {
    const originalSetItem = window.localStorage.setItem;
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    expect(() => saveProfile({ cityName: 'Bengaluru' })).not.toThrow();
    window.localStorage.setItem = originalSetItem;
  });

  it('purges user profile and active sessionStorage on clearProfile', () => {
    saveProfile({ cityName: 'Delhi' });
    window.sessionStorage.setItem('temp_data', '123');

    clearProfile();
    expect(window.localStorage.getItem(PROFILE_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem('temp_data')).toBeNull();
  });
});
