// User profile storage, schema validation, migration, and sanitization.
import {
  DEFAULT_PROFILE,
  PROFILE_SCHEMA_VERSION,
  PROFILE_STORAGE_KEY,
  profileSchema,
  type StoredProfile,
} from './profile.types.js';

export { DEFAULT_PROFILE, PROFILE_SCHEMA_VERSION, PROFILE_STORAGE_KEY, profileSchema };
export type { StoredProfile };

let inMemoryProfile: StoredProfile | null = null;

/**
 * Normalizes numerical boundaries on profile attributes.
 *
 * @param input - Partial or untrusted profile object.
 * @returns Sanitized and clamped StoredProfile.
 */
export function normalizeProfile(input: unknown): StoredProfile {
  const obj = (typeof input === 'object' && input !== null) ? (input as Record<string, unknown>) : {};
  const rawDist = Number(obj.commuteDistanceKm ?? DEFAULT_PROFILE.commuteDistanceKm);
  const rawMembers = Number(obj.householdMembers ?? DEFAULT_PROFILE.householdMembers);

  const merged = {
    ...DEFAULT_PROFILE,
    ...obj,
    commuteDistanceKm: Math.max(0, Number.isNaN(rawDist) ? 0 : rawDist),
    householdMembers: Math.max(1, Math.round(Number.isNaN(rawMembers) ? 1 : rawMembers)),
    version: PROFILE_SCHEMA_VERSION,
  };

  const parsed = profileSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_PROFILE;
}

/**
 * Migrates legacy profile formats (e.g. v0 with 'city' property) to current schema.
 *
 * @param oldProfile - Unknown legacy profile object.
 * @returns Fully upgraded StoredProfile.
 */
export function migrateProfile(oldProfile: unknown): StoredProfile {
  if (!oldProfile || typeof oldProfile !== 'object') return DEFAULT_PROFILE;
  const legacy = oldProfile as Record<string, unknown>;
  const migrated = {
    ...legacy,
    cityName: legacy.cityName ?? legacy.city ?? DEFAULT_PROFILE.cityName,
    version: PROFILE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
  return normalizeProfile(migrated);
}

/**
 * Safely parses raw serialized JSON profile, recovering to DEFAULT_PROFILE on error.
 *
 * @param raw - Serialized JSON string.
 * @returns Validated StoredProfile.
 */
export function parseProfile(raw: string): StoredProfile {
  try {
    const parsed = JSON.parse(raw);
    return migrateProfile(parsed);
  } catch {
    return DEFAULT_PROFILE;
  }
}

/**
 * Reads user profile from localStorage with fallback to default.
 *
 * @returns Active StoredProfile.
 */
export function getProfile(): StoredProfile {
  if (inMemoryProfile) return inMemoryProfile;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        inMemoryProfile = parseProfile(stored);
        return inMemoryProfile;
      }
    }
  } catch {
    // Storage access restricted: degrade to default
  }
  return DEFAULT_PROFILE;
}

/**
 * Persists updated user profile preferences with quota exceeded degradation.
 *
 * @param partial - Partial or complete updated profile data.
 * @returns Newly persisted StoredProfile.
 */
export function saveProfile(partial: Partial<StoredProfile>): StoredProfile {
  const current = getProfile();
  const normalized = normalizeProfile({
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  });

  inMemoryProfile = normalized;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch {
    // QuotaExceededError or security exception: degrade gracefully
  }
  return normalized;
}

/**
 * Completely purges profile from localStorage and clears active tab sessionStorage.
 */
export function clearProfile(): void {
  inMemoryProfile = null;
  try {
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem(PROFILE_STORAGE_KEY);
      window.sessionStorage?.clear();
    }
  } catch {
    // ignore
  }
}
