// Open-Meteo Geocoding API client with input sanitization, caching, and normalization.
import { roundCoordinates } from './geolocation.js';
import { geocodingResponseSchema, geocodingSchema } from './openMeteo.schemas.js';
import { createCache } from './cache.js';
import type {
  GeocodingLocation,
  RawGeocodingResponse,
  RawGeocodingResult,
} from './openMeteo.types.js';

export { geocodingSchema };

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const CLIENT_TIMEOUT_MS = 6000;
const geocodingCache = createCache<GeocodingLocation[]>({
  ttlMs: 30 * 60 * 1000,
  prefix: 'geo_',
});

/**
 * Sanitizes input query by removing HTML tags and non-printable control characters.
 *
 * @param query - Raw search query string.
 * @returns Sanitized safe query string.
 */
export function sanitizeQuery(query: string): string {
  if (typeof query !== 'string') return '';
  const noScript = query.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  const strippedTags = noScript.replace(/<[^>]*>/g, '').trim();
  let clean = '';
  for (let i = 0; i < strippedTags.length; i++) {
    const code = strippedTags.charCodeAt(i);
    if (code >= 32 && code !== 127) {
      clean += strippedTags[i];
    }
  }
  return clean;
}

/**
 * Builds formatted Open-Meteo Geocoding URL.
 *
 * @param query - Search location query.
 * @returns Encoded URL string.
 */
export function buildGeocodingUrl(query: string): string {
  const sanitized = sanitizeQuery(query);
  return `${GEOCODING_BASE_URL}?name=${encodeURIComponent(sanitized)}&count=10&language=en&format=json`;
}

/**
 * Normalizes location item with 2-decimal rounded coordinates and display name.
 *
 * @param raw - Raw geocoding result item.
 * @returns Formatted GeocodingLocation object.
 */
export function normalizeLocation(
  raw: RawGeocodingResult | { name: string; latitude: number; longitude: number; country?: string; admin1?: string; id?: number }
): GeocodingLocation {
  const rounded = roundCoordinates(raw.latitude, raw.longitude);
  const parts = [raw.name, raw.admin1, raw.country].filter(Boolean);
  return {
    id: raw.id ?? Math.floor(Math.random() * 1000000),
    name: raw.name,
    latitude: rounded.lat,
    longitude: rounded.lon,
    country: raw.country,
    admin1: raw.admin1,
    displayName: parts.join(', '),
  };
}

/**
 * Parses raw geocoding response into an array of normalized locations.
 *
 * @param raw - Raw API response JSON.
 * @returns Array of GeocodingLocation objects.
 */
export function parseGeocodingResults(raw: unknown): GeocodingLocation[] {
  if (!raw || typeof raw !== 'object') return [];
  const parsed = geocodingResponseSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.results) return [];
  return parsed.data.results.map((item) => normalizeLocation(item));
}

/** Clears all cached geocoding search entries. */
export function clearGeocodingCache(): void {
  geocodingCache.clear();
}

/**
 * Searches locations matching query string with caching and cancellation.
 *
 * @param query - City or locality search term.
 * @param signal - Optional AbortSignal.
 * @returns Promise resolving to matched locations.
 */
export async function searchLocations(
  query: string,
  signal?: AbortSignal
): Promise<GeocodingLocation[]> {
  if (signal?.aborted) {
    throw new DOMException('The user aborted a request.', 'AbortError');
  }

  const clean = sanitizeQuery(query);
  if (clean.length < 1) return [];

  const cacheKey = clean.toLowerCase();
  const cached = geocodingCache.get(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  const onCallerAbort = (): void => controller.abort();
  if (signal) signal.addEventListener('abort', onCallerAbort);

  try {
    const url = buildGeocodingUrl(clean);
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Open-Meteo Geocoding error: HTTP ${res.status}`);
    const results = parseGeocodingResults((await res.json()) as RawGeocodingResponse);
    geocodingCache.set(cacheKey, results);
    return results;
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener('abort', onCallerAbort);
  }
}
