// Unit tests for Open-Meteo geocoding search client and query sanitization.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  buildGeocodingUrl,
  clearGeocodingCache,
  geocodingSchema,
  normalizeLocation,
  parseGeocodingResults,
  sanitizeQuery,
  searchLocations,
} from './geocoding.js';

describe('Open-Meteo Geocoding Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearGeocodingCache();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sanitizes query removing HTML tags and non-printable control characters', () => {
    const malicious = "<script>alert('xss')</script>Delhi\x00\x1F";
    const cleaned = sanitizeQuery(malicious);
    expect(cleaned).toBe('Delhi');
    expect(cleaned).not.toContain('<script>');
  });

  it('handles empty and non-string queries in sanitizeQuery', () => {
    expect(sanitizeQuery('')).toBe('');
    expect(sanitizeQuery(null as unknown as string)).toBe('');
  });

  it('truncates oversized queries to 100 characters in sanitizeQuery', () => {
    const longQuery = 'a'.repeat(180);
    expect(sanitizeQuery(longQuery)).toHaveLength(100);
  });

  it('builds encoded URL for search term', () => {
    const url = buildGeocodingUrl('New Delhi');
    expect(url).toContain('geocoding-api.open-meteo.com');
    expect(url).toContain('name=New%20Delhi');
  });

  it('normalizes location coordinates to 2 decimal places and formats display name', () => {
    const raw = {
      id: 1234,
      name: 'Delhi',
      latitude: 28.613928,
      longitude: 77.209021,
      country: 'India',
      admin1: 'Delhi',
    };
    const norm = normalizeLocation(raw);
    expect(norm.latitude).toBe(28.61);
    expect(norm.longitude).toBe(77.21);
    expect(norm.displayName).toBe('Delhi, Delhi, India');
  });

  it('parses geocoding results and gracefully handles empty payload', () => {
    expect(parseGeocodingResults({})).toEqual([]);
    expect(parseGeocodingResults(null)).toEqual([]);
    expect(parseGeocodingResults({ results: [] })).toEqual([]);

    const payload = {
      results: [
        { id: 1, name: 'Mumbai', latitude: 19.076, longitude: 72.877, country: 'India' },
      ],
    };
    const parsed = parseGeocodingResults(payload);
    expect(parsed.length).toBe(1);
    expect(parsed[0].name).toBe('Mumbai');
    expect(parsed[0].latitude).toBe(19.08);
  });

  it('validates schema with geocodingSchema', () => {
    expect(geocodingSchema.safeParse({ results: [] }).success).toBe(true);
  });

  it('short-circuits empty and whitespace-only searches without network request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = await searchLocations('   ');
    expect(res).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('searches locations, parses results, and caches responses', async () => {
    const mockResponse = {
      results: [
        { id: 1, name: 'Bengaluru', latitude: 12.9716, longitude: 77.5946, country: 'India' },
      ],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const locations = await searchLocations('Bengaluru');
    expect(locations.length).toBe(1);
    expect(locations[0].name).toBe('Bengaluru');
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Cache hit
    const cachedLocations = await searchLocations('Bengaluru');
    expect(cachedLocations.length).toBe(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('throws on upstream HTTP error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    await expect(searchLocations('Nowhere')).rejects.toThrow('HTTP 404');
  });

  it('aborts search request when AbortSignal fires', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(searchLocations('Delhi', controller.signal)).rejects.toThrow();
  });
});
