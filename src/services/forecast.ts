// Open-Meteo Weather Forecast API client with atmospheric mixing factors analysis.
import { API_TIMEOUTS, CACHE_CONFIG } from '../constants/index.js';
import { roundCoordinates } from './geolocation.js';
import { weatherResponseSchema } from './openMeteo.schemas.js';
import { createCache, generateCacheKey } from './cache.js';
import { fetchJsonWithTimeout } from './http.js';
import type {
  ForecastData,
  HourlyWeatherPoint,
  RawWeatherResponse,
  WeatherFactors,
} from './openMeteo.types.js';

export { weatherResponseSchema as weatherSchema };

const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const forecastCache = createCache<ForecastData>({ ttlMs: CACHE_CONFIG.TTL_MS, prefix: 'fc_' });

/** Builds Open-Meteo Weather Forecast URL with mixing parameters. */
export function buildWeatherUrl(lat: number, lon: number): string {
  const rounded = roundCoordinates(lat, lon);
  const params = 'temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m';
  return `${WEATHER_BASE_URL}?latitude=${rounded.lat}&longitude=${rounded.lon}&current=${params}&hourly=${params}&timezone=auto`;
}

/**
 * Detects presence of thermal inversion or atmospheric stagnation.
 *
 * @param params - Wind speed, humidity, and hour of day.
 * @returns True if atmospheric inversion conditions are met.
 */
export function detectInversion(params: {
  windSpeed: number;
  humidity: number;
  hourOfDay?: number;
}): boolean {
  const isCalm = params.windSpeed <= 1.5;
  const isHumid = params.humidity >= 75;
  const isEarlyOrNight = params.hourOfDay === undefined ||
    params.hourOfDay <= 9 ||
    params.hourOfDay >= 20;
  return isCalm && isHumid && isEarlyOrNight;
}

/**
 * Produces a plain words atmospheric impact summary.
 *
 * @param factors - Wind speed and humidity indicators.
 * @returns Plain language explanation of weather mixing.
 */
export function getWeatherSummary(factors: {
  windSpeed?: number;
  humidity?: number;
}): string {
  const wind = factors.windSpeed ?? 2.0;
  const humid = factors.humidity ?? 50;
  if (wind <= 1.0 && humid >= 75) {
    return 'Stagnant air and heavy humidity trap pollutants near ground level.';
  }
  if (wind <= 2.0) {
    return 'Light breeze provides minimal pollutant dispersion.';
  }
  return 'Active wind ventilation promotes healthy atmospheric dispersion.';
}

/**
 * Calculates stagnation risk category from wind and humidity.
 *
 * @param windSpeed - Wind speed in m/s.
 * @param humidity - Relative humidity %.
 * @returns Stagnation risk level.
 */
function getStagnationRisk(windSpeed: number, humidity: number): 'low' | 'moderate' | 'high' | 'severe' {
  if (windSpeed <= 0.8 && humidity >= 80) return 'severe';
  if (windSpeed <= 1.5 && humidity >= 70) return 'high';
  if (windSpeed <= 2.5) return 'moderate';
  return 'low';
}

/**
 * Parses raw weather factors into structured dispersion indicators.
 *
 * @param params - Weather parameter readings.
 * @returns WeatherFactors dataset.
 */
export function parseWeatherFactors(params: {
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  surfacePressure?: number;
}): WeatherFactors {
  const temp = params.temperature ?? 20;
  const humid = params.humidity ?? 50;
  const wind = params.windSpeed ?? 2;
  const pressure = params.surfacePressure ?? 1013;
  const isInversion = detectInversion({ windSpeed: wind, humidity: humid });

  return {
    temperature: temp,
    humidity: humid,
    windSpeed: wind,
    surfacePressure: pressure,
    stagnationRisk: getStagnationRisk(wind, humid),
    isInversion,
    summary: getWeatherSummary({ windSpeed: wind, humidity: humid }),
  };
}

/**
 * Parses hourly weather projection points from API payload.
 *
 * @param payload - Raw API response JSON.
 * @returns Array of HourlyWeatherPoint items.
 */
export function parseHourlyForecast(payload: unknown): HourlyWeatherPoint[] {
  const result = weatherResponseSchema.safeParse(payload);
  if (!result.success || !('hourly' in result.data) || !result.data.hourly?.time) {
    return [];
  }
  const hourly = result.data.hourly;
  return hourly.time.map((time, idx) => ({
    time,
    temperature: hourly.temperature_2m?.[idx] ?? 20,
    humidity: hourly.relative_humidity_2m?.[idx] ?? 50,
    windSpeed: hourly.wind_speed_10m?.[idx] ?? 2,
    surfacePressure: hourly.surface_pressure?.[idx] ?? 1013,
  }));
}

/** Builds ForecastData from parsed response and coordinates. */
function buildForecastData(
  json: RawWeatherResponse,
  lat: number,
  lon: number
): ForecastData {
  const cur = json.current;
  const current = parseWeatherFactors({
    temperature: cur?.temperature_2m ?? undefined,
    humidity: cur?.relative_humidity_2m ?? undefined,
    windSpeed: cur?.wind_speed_10m ?? undefined,
    surfacePressure: cur?.surface_pressure ?? undefined,
  });
  return {
    latitude: lat,
    longitude: lon,
    current,
    hourly: parseHourlyForecast(json),
    fetchedAt: new Date().toISOString(),
  };
}

/** Clears all cached weather forecast query entries. */
export function clearForecastCache(): void {
  forecastCache.clear();
}

/**
 * Fetches 48-hour weather forecast data with timeout and caching.
 *
 * @param lat - Latitude coordinate.
 * @param lon - Longitude coordinate.
 * @param signal - Optional AbortSignal.
 * @returns Promise resolving to ForecastData.
 */
export async function fetchForecast(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<ForecastData> {
  if (signal?.aborted) {
    throw new DOMException('The user aborted a request.', 'AbortError');
  }

  const rounded = roundCoordinates(lat, lon);
  const cacheKey = generateCacheKey(rounded.lat, rounded.lon, 'fc_');
  const cached = forecastCache.get(cacheKey);
  if (cached) return cached;

  const url = buildWeatherUrl(rounded.lat, rounded.lon);
  const json = await fetchJsonWithTimeout<RawWeatherResponse>(
    url,
    API_TIMEOUTS.OPEN_METEO_TIMEOUT_MS,
    'Open-Meteo Forecast error',
    signal
  );
  const data = buildForecastData(json, rounded.lat, rounded.lon);
  forecastCache.set(cacheKey, data);
  return data;
}
