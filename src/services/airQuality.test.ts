// Unit tests for Open-Meteo air quality client, URL builder, and parsing logic.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  buildAirQualityUrl,
  clearAirQualityCache,
  fetchAirQuality,
  parseAirQualityResponse,
  roundCoordinates,
  validateCoordinates,
  airQualitySchema,
} from './airQuality.js';

describe('Open-Meteo Air Quality Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearAirQualityCache();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds request URL containing Open-Meteo host and pollutant parameters', () => {
    const url = buildAirQualityUrl(28.6139, 77.209);
    expect(url).toContain('air-quality-api.open-meteo.com');
    expect(url).toContain('latitude=28.61');
    expect(url).toContain('longitude=77.21');
    expect(url).toContain('pm2_5');
    expect(url).toContain('pm10');
  });

  it('validates geographic coordinate ranges', () => {
    expect(validateCoordinates(28.61, 77.21)).toBe(true);
    expect(validateCoordinates(-90, 180)).toBe(true);
    expect(validateCoordinates(91, 77.21)).toBe(false);
    expect(validateCoordinates(28.61, 181)).toBe(false);
    expect(validateCoordinates(NaN, 77.21)).toBe(false);
    expect(validateCoordinates('28' as unknown as number, 77)).toBe(false);
  });

  it('rounds coordinates to 2 decimal places', () => {
    const rounded = roundCoordinates(28.613928, 77.209021);
    expect(rounded.lat).toBe(28.61);
    expect(rounded.lon).toBe(77.21);
  });

  it('validates and parses 48-hour hourly air quality response', () => {
    const mockPayload = {
      latitude: 28.61,
      longitude: 77.21,
      current: { pm2_5: 120, pm10: 210, nitrogen_dioxide: 45 },
      hourly: {
        time: Array.from({ length: 48 }, (_, i) => `2026-11-24T${String(i % 24).padStart(2, '0')}:00Z`),
        pm2_5: Array.from({ length: 48 }, () => 120),
        pm10: Array.from({ length: 48 }, () => 210),
      },
    };

    const data = parseAirQualityResponse(mockPayload);
    expect(data.hourly.length).toBe(48);
    expect(data.currentAqi).toBeGreaterThan(0);
    expect(data.currentCategory).toBeDefined();
    expect(data.dominantPollutant).toBeDefined();
    expect(data.isEstimate).toBe(true);
  });

  it('handles missing current fields by falling back to hourly readings', () => {
    const payload = {
      latitude: 28.61,
      longitude: 77.21,
      hourly: {
        time: ['2026-11-24T00:00:00Z'],
        pm2_5: [140],
        pm10: [220],
      },
    };
    const data = parseAirQualityResponse(payload);
    expect(data.pollutants.pm2_5).toBe(140);
    expect(data.currentAqi).toBeGreaterThan(0);
  });

  it('validates response schema and rejects invalid payloads', () => {
    expect(airQualitySchema.safeParse({ invalid: 'payload' }).success).toBe(false);
    const valid = {
      latitude: 28.61,
      longitude: 77.21,
      hourly: { time: ['2026-11-24T00:00:00Z'], pm2_5: [50] },
    };
    expect(airQualitySchema.safeParse(valid).success).toBe(true);
  });

  it('fetches air quality from network and caches the result', async () => {
    const mockResponse = {
      latitude: 28.61,
      longitude: 77.21,
      current: { pm2_5: 85, pm10: 150 },
      hourly: { time: ['2026-11-24T00:00:00Z'], pm2_5: [85], pm10: [150] },
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchAirQuality(28.61, 77.21);
    expect(result.currentAqi).toBeGreaterThan(0);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Second call should hit the cache without calling fetch
    const cachedResult = await fetchAirQuality(28.61, 77.21);
    expect(cachedResult.currentAqi).toBe(result.currentAqi);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('throws on HTTP upstream errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response);

    await expect(fetchAirQuality(19.07, 72.87)).rejects.toThrow('HTTP 503');
  });

  it('supports request cancellation via AbortSignal', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(fetchAirQuality(28.61, 77.21, controller.signal)).rejects.toThrow();
  });
});
