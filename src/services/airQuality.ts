// Open-Meteo Air Quality API client with caching, validation, and CPCB AQI parsing.
import { API_TIMEOUTS, CACHE_CONFIG } from '../constants/index.js';
import { calculateAqi } from '../domain/aqi.js';
import { roundCoordinates, validateCoordinates } from './geolocation.js';
import { airQualityResponseSchema } from './openMeteo.schemas.js';
import { createCache, generateCacheKey } from './cache.js';
import { fetchJsonWithTimeout } from './http.js';
import type {
  AirQualityData,
  HourlyAirQualityPoint,
  RawAirQualityResponse,
} from './openMeteo.types.js';

export { roundCoordinates, validateCoordinates, airQualityResponseSchema as airQualitySchema };

const AIR_QUALITY_BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const aqCache = createCache<AirQualityData>({ ttlMs: CACHE_CONFIG.TTL_MS, prefix: 'aq_' });

/**
 * Constructs the Open-Meteo Air Quality API request URL with standard pollutants.
 *
 * @param lat - Latitude coordinate.
 * @param lon - Longitude coordinate.
 * @returns Formatted query URL.
 */
export function buildAirQualityUrl(lat: number, lon: number): string {
  const rounded = roundCoordinates(lat, lon);
  const hourlyParams = 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone';
  return `${AIR_QUALITY_BASE_URL}?latitude=${rounded.lat}&longitude=${rounded.lon}&hourly=${hourlyParams}&current=${hourlyParams}&timezone=auto`;
}

/** Safely gets a pollutant number from an array at index. */
function getPollutantAt(
  arr?: readonly (number | null)[],
  idx = 0
): number | undefined {
  if (!arr) return undefined;
  const val = arr[idx];
  return val === null || val === undefined ? undefined : val;
}

/** Resolves pollutant value from current reading or fallback. */
function readPollutant(
  cur: RawAirQualityResponse['current'],
  key: keyof NonNullable<RawAirQualityResponse['current']>,
  fbVal: number | undefined
): number | undefined {
  if (cur) {
    const v = cur[key];
    if (typeof v === 'number') return v;
  }
  return fbVal;
}

/** Builds a single hourly air quality point. */
function buildHourlyPoint(
  hourly: RawAirQualityResponse['hourly'],
  idx: number,
  time: string
): HourlyAirQualityPoint {
  const pm25 = getPollutantAt(hourly.pm2_5, idx) ?? 0;
  const pm10 = getPollutantAt(hourly.pm10, idx);
  const aqiResult = calculateAqi(pm25, pm10);
  return {
    time,
    aqi: aqiResult.aqi,
    category: aqiResult.category,
    pm2_5: pm25,
    pm10,
    no2: getPollutantAt(hourly.nitrogen_dioxide, idx),
    so2: getPollutantAt(hourly.sulphur_dioxide, idx),
    co: getPollutantAt(hourly.carbon_monoxide, idx),
    o3: getPollutantAt(hourly.ozone, idx),
    isEstimate: true,
  };
}

/** Transforms raw hourly arrays into domain HourlyAirQualityPoint objects. */
function mapHourlyPoints(
  hourly: RawAirQualityResponse['hourly']
): HourlyAirQualityPoint[] {
  const times = hourly.time || [];
  return times.map((time, idx) => buildHourlyPoint(hourly, idx, time));
}

/** Extracts pollutant summary from current snapshot and hourly fallbacks. */
function extractCurrentPollutants(
  parsed: RawAirQualityResponse,
  fallback?: HourlyAirQualityPoint
): AirQualityData['pollutants'] {
  const c = parsed.current;
  const f = fallback;
  return {
    pm2_5: readPollutant(c, 'pm2_5', f?.pm2_5) ?? 0,
    pm10: readPollutant(c, 'pm10', f?.pm10),
    no2: readPollutant(c, 'nitrogen_dioxide', f?.no2),
    so2: readPollutant(c, 'sulphur_dioxide', f?.so2),
    co: readPollutant(c, 'carbon_monoxide', f?.co),
    o3: readPollutant(c, 'ozone', f?.o3),
  };
}

/**
 * Parses and validates raw Open-Meteo payload into structured AirQualityData.
 *
 * @param payload - Raw API response JSON.
 * @returns Structured domain air quality dataset.
 */
export function parseAirQualityResponse(payload: unknown): AirQualityData {
  const parsed = airQualityResponseSchema.parse(payload) as RawAirQualityResponse;
  const hourly = mapHourlyPoints(parsed.hourly);
  const pollutants = extractCurrentPollutants(parsed, hourly[0]);
  const aqiResult = calculateAqi(pollutants.pm2_5, pollutants.pm10);

  return {
    latitude: parsed.latitude ?? 0,
    longitude: parsed.longitude ?? 0,
    currentAqi: aqiResult.aqi,
    currentCategory: aqiResult.category,
    dominantPollutant: aqiResult.dominantPollutant,
    isEstimate: true,
    pollutants,
    hourly,
    source: 'Open-Meteo CAMS',
    fetchedAt: new Date().toISOString(),
  };
}

/** Clears all cached air quality query entries. */
export function clearAirQualityCache(): void {
  aqCache.clear();
}

/**
 * Fetches air quality data with timeout, caching, and CPCB AQI calculation.
 *
 * @param lat - Latitude coordinate.
 * @param lon - Longitude coordinate.
 * @param signal - Optional cancellation AbortSignal.
 * @returns Promise resolving to domain AirQualityData.
 */
export async function fetchAirQuality(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<AirQualityData> {
  if (signal?.aborted) {
    throw new DOMException('The user aborted a request.', 'AbortError');
  }

  const rounded = roundCoordinates(lat, lon);
  const cacheKey = generateCacheKey(rounded.lat, rounded.lon, 'aq_');
  const cached = aqCache.get(cacheKey);
  if (cached) return cached;

  const url = buildAirQualityUrl(rounded.lat, rounded.lon);
  const raw = await fetchJsonWithTimeout<unknown>(
    url,
    API_TIMEOUTS.OPEN_METEO_TIMEOUT_MS,
    'Open-Meteo Air Quality error',
    signal
  );
  const data = parseAirQualityResponse(raw);
  aqCache.set(cacheKey, data);
  return data;
}
