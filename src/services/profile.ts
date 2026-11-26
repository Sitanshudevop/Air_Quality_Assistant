// User profile storage, schema validation, migration, and sanitization.
import { getErrorMessage } from '../utils/error.js';
import { logError } from '../utils/logger.js';
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

function clampProfileNumbers(obj: Record<string, unknown>): {
  commuteDistanceKm: number;
  householdMembers: number;
} {
  const rawDist = Number(obj.commuteDistanceKm ?? DEFAULT_PROFILE.commuteDistanceKm);
  const rawMembers = Number(obj.householdMembers ?? DEFAULT_PROFILE.householdMembers);
  const commuteDistanceKm = Number.isFinite(rawDist)
    ? Math.min(100, Math.max(0, rawDist))
    : DEFAULT_PROFILE.commuteDistanceKm;
  const householdMembers = Number.isFinite(rawMembers)
    ? Math.min(20, Math.max(1, Math.round(rawMembers)))
    : DEFAULT_PROFILE.householdMembers;
  return { commuteDistanceKm, householdMembers };
}

function normalizeWithValidity(input: unknown): { profile: StoredProfile; valid: boolean } {
  const obj = (typeof input === 'object' && input !== null && !Array.isArray(input))
    ? (input as Record<string, unknown>)
    : {};
  const merged = {
    ...DEFAULT_PROFILE,
    ...obj,
    ...clampProfileNumbers(obj),
    version: PROFILE_SCHEMA_VERSION,
  };
  const parsed = profileSchema.safeParse(merged);
  if (!parsed.success) {
    return { profile: DEFAULT_PROFILE, valid: false };
  }
  return { profile: parsed.data, valid: true };
}

/**
 * Normalizes numerical boundaries on profile attributes.
 *
 * @param input - Partial or untrusted profile object.
 * @returns Sanitized and clamped StoredProfile.
 */
export function normalizeProfile(input: unknown): StoredProfile {
  return normalizeWithValidity(input).profile;
}

/**
 * Migrates legacy profile formats (e.g. v0 with 'city' property) to current schema.
 *
 * @param oldProfile - Unknown legacy profile object.
 * @returns Fully upgraded StoredProfile.
 */
export function migrateProfile(oldProfile: unknown): StoredProfile {
  if (!oldProfile || typeof oldProfile !== 'object' || Array.isArray(oldProfile)) {
    return DEFAULT_PROFILE;
  }
  const legacy = oldProfile as Record<string, unknown>;
  return normalizeProfile({
    ...legacy,
    cityName: legacy.cityName ?? legacy.city ?? DEFAULT_PROFILE.cityName,
    version: PROFILE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  });
}

function parseProfileWithValidity(raw: string): { profile: StoredProfile; valid: boolean } {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      logError('Invalid profile payload shape in localStorage', { action: 'parseProfile' });
      return { profile: DEFAULT_PROFILE, valid: false };
    }
    const legacy = parsed as Record<string, unknown>;
    const result = normalizeWithValidity({
      ...legacy,
      cityName: legacy.cityName ?? legacy.city ?? DEFAULT_PROFILE.cityName,
      version: PROFILE_SCHEMA_VERSION,
      updatedAt: typeof legacy.updatedAt === 'string' ? legacy.updatedAt : new Date().toISOString(),
    });
    if (!result.valid) {
      logError('Profile failed schema validation in localStorage', { action: 'parseProfile' });
    }
    return result;
  } catch (err) {
    logError('Corrupted profile JSON in localStorage', {
      action: 'parseProfile',
      error: getErrorMessage(err),
    });
    return { profile: DEFAULT_PROFILE, valid: false };
  }
}

/**
 * Safely parses raw serialized JSON profile, recovering to DEFAULT_PROFILE on error.
 *
 * @param raw - Serialized JSON string.
 * @returns Validated StoredProfile.
 */
export function parseProfile(raw: string): StoredProfile {
  return parseProfileWithValidity(raw).profile;
}

/**
 * Reads user profile from localStorage with fallback to default.
 *
 * @returns Active StoredProfile.
 */
export function getProfile(): StoredProfile {
  if (inMemoryProfile) return inMemoryProfile;
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_PROFILE;
  try {
    const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!stored) return DEFAULT_PROFILE;
    const result = parseProfileWithValidity(stored);
    if (!result.valid) {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      return DEFAULT_PROFILE;
    }
    inMemoryProfile = result.profile;
    return result.profile;
  } catch (err) {
    logError('Failed reading profile from localStorage', {
      action: 'getProfile',
      error: getErrorMessage(err),
    });
    return DEFAULT_PROFILE;
  }
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
  } catch (err) {
    logError('Failed saving profile to localStorage', {
      action: 'saveProfile',
      error: getErrorMessage(err),
    });
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
