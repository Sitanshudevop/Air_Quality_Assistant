// Open-Meteo Geocoding API client with input sanitization, caching, and normalization.
import { API_TIMEOUTS, CACHE_CONFIG } from '../constants/index.js';
import { roundCoordinates } from './geolocation.js';
import { geocodingResponseSchema, geocodingSchema } from './openMeteo.schemas.js';
import { createCache } from './cache.js';
import { fetchJsonWithTimeout } from './http.js';
import type {
  GeocodingLocation,
  RawGeocodingResponse,
  RawGeocodingResult,
} from './openMeteo.types.js';

export { geocodingSchema };

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const geocodingCache = createCache<GeocodingLocation[]>({
  ttlMs: CACHE_CONFIG.GEOCODING_TTL_MS,
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
  return clean.slice(0, 100);
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

  const url = buildGeocodingUrl(clean);
  const raw = await fetchJsonWithTimeout<RawGeocodingResponse>(
    url,
    API_TIMEOUTS.OPEN_METEO_TIMEOUT_MS,
    'Open-Meteo Geocoding error',
    signal
  );
  const results = parseGeocodingResults(raw);
  geocodingCache.set(cacheKey, results);
  return results;
}

/**
 * Reverse-geocodes rounded coordinates to a human-readable city/locality name.
 * Falls back to rounded coordinate string when offline or unavailable.
 *
 * @param lat - Latitude in decimal degrees.
 * @param lon - Longitude in decimal degrees.
 * @param signal - Optional AbortSignal.
 * @returns Resolved city name or rounded coordinate fallback.
 */
export async function reverseGeocode(lat: number, lon: number, signal?: AbortSignal): Promise<string> {
  const r = roundCoordinates(lat, lon);
  const fallback = `${r.lat}, ${r.lon}`;
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${r.lat}&longitude=${r.lon}&localityLanguage=en`;
    const data = await fetchJsonWithTimeout<{ city?: string; locality?: string; principalSubdivision?: string }>(
      url, API_TIMEOUTS.OPEN_METEO_TIMEOUT_MS, 'Reverse geocoding error', signal,
    );
    const primary = (data.city || data.locality || data.principalSubdivision || '').trim();
    if (!primary) return fallback;
    const sub = (data.principalSubdivision || '').trim();
    return sub && sub.toLowerCase() !== primary.toLowerCase() ? `${primary}, ${sub}` : primary;
  } catch {
    return fallback;
  }
}
