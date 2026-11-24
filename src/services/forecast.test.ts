// Unit tests for Open-Meteo weather forecast client and atmospheric mixing analysis.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  buildWeatherUrl,
  clearForecastCache,
  detectInversion,
  fetchForecast,
  getWeatherSummary,
  parseHourlyForecast,
  parseWeatherFactors,
  weatherSchema,
} from './forecast.js';

describe('Open-Meteo Forecast Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearForecastCache();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds weather URL containing temperature and wind speed parameters', () => {
    const url = buildWeatherUrl(28.6139, 77.209);
    expect(url).toContain('api.open-meteo.com/v1/forecast');
    expect(url).toContain('temperature_2m');
    expect(url).toContain('wind_speed_10m');
  });

  it('detects inversion during calm, humid, early morning hours', () => {
    const inversion1 = detectInversion({ windSpeed: 0.6, humidity: 85, hourOfDay: 6 });
    expect(inversion1).toBe(true);

    const inversion2 = detectInversion({ windSpeed: 0, humidity: 90, hourOfDay: 5 });
    expect(inversion2).toBe(true);

    const noInversion = detectInversion({ windSpeed: 3.5, humidity: 45, hourOfDay: 14 });
    expect(noInversion).toBe(false);
  });

  it('provides plain words atmospheric mixing summaries', () => {
    const summaryStagnant = getWeatherSummary({ windSpeed: 0.5, humidity: 85 });
    expect(summaryStagnant).toContain('Stagnant air');

    const summaryLight = getWeatherSummary({ windSpeed: 1.5, humidity: 60 });
    expect(summaryLight).toContain('Light breeze');

    const summaryGood = getWeatherSummary({ windSpeed: 4.0, humidity: 40 });
    expect(summaryGood).toContain('dispersion');
  });

  it('parses weather factors and handles negative temperatures and zero wind', () => {
    const factors = parseWeatherFactors({
      temperature: -4,
      humidity: 90,
      windSpeed: 0,
      surfacePressure: 1020,
    });
    expect(factors.temperature).toBe(-4);
    expect(factors.stagnationRisk).toBe('severe');
    expect(factors.isInversion).toBe(true);
  });

  it('parses 48-hour hourly weather forecast points', () => {
    const payload = {
      latitude: 28.61,
      longitude: 77.21,
      hourly: {
        time: ['2026-11-24T00:00:00Z', '2026-11-24T01:00:00Z'],
        temperature_2m: [15, 14],
        relative_humidity_2m: [80, 85],
        wind_speed_10m: [1.2, 1.0],
        surface_pressure: [1015, 1016],
      },
    };
    const points = parseHourlyForecast(payload);
    expect(points.length).toBe(2);
    expect(points[0].temperature).toBe(15);
  });

  it('returns empty array when hourly data is absent in payload', () => {
    const emptyPoints = parseHourlyForecast({});
    expect(emptyPoints).toEqual([]);
  });

  it('validates schema rejecting invalid weather payloads', () => {
    expect(weatherSchema.safeParse({ invalid: 'data' }).success).toBe(false);
  });

  it('fetches forecast from network and verifies caching', async () => {
    const mockResponse = {
      latitude: 28.61,
      longitude: 77.21,
      current: {
        temperature_2m: 18,
        relative_humidity_2m: 75,
        wind_speed_10m: 1.2,
        surface_pressure: 1014,
      },
      hourly: {
        time: ['2026-11-24T00:00:00Z'],
        temperature_2m: [18],
        relative_humidity_2m: [75],
        wind_speed_10m: [1.2],
        surface_pressure: [1014],
      },
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchForecast(28.61, 77.21);
    expect(result.current.temperature).toBe(18);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Cache hit
    const cached = await fetchForecast(28.61, 77.21);
    expect(cached.current.temperature).toBe(18);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('throws on network HTTP error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(fetchForecast(28.61, 77.21)).rejects.toThrow('HTTP 500');
  });

  it('cancels request via AbortSignal', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(fetchForecast(28.61, 77.21, controller.signal)).rejects.toThrow();
  });
});
