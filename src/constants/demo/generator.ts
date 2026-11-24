// Deterministic diurnal atmospheric physics generator and deep freeze utility.
import { calculateAqi } from '../../domain/aqi.js';
import type {
  HourlyAirQualityPoint,
  HourlyWeatherPoint,
} from '../../services/openMeteo.types.js';

/**
 * Recursively freezes an object and its nested properties for absolute immutability.
 *
 * @param obj - Target object or array.
 * @returns Fully deep frozen reference.
 */
export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj as object)) {
    const val = (obj as Record<string, unknown>)[key];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

/** Diurnal PM2.5 multiplier by hour of day (0-23). */
const DIURNAL_PM25_FACTORS = [
  1.10, 1.15, 1.20, 1.25, 1.30, 1.35, 1.35, 1.30, 1.15, 0.95, 0.80, 0.75,
  0.70, 0.70, 0.75, 0.85, 1.00, 1.15, 1.25, 1.25, 1.20, 1.15, 1.10, 1.05,
];

/**
 * Generates 48-hour deterministic diurnal hourly air quality and weather curves.
 *
 * @param basePm25 - Base PM2.5 concentration in µg/m³.
 * @param baseTemp - Base temperature in °C.
 * @param baseHumidity - Base relative humidity in %.
 * @param baseWind - Base wind speed in m/s.
 * @returns 48 hours of projected hourly air quality and weather points.
 */
export function generateDiurnalHourly(
  basePm25: number,
  baseTemp: number,
  baseHumidity: number,
  baseWind: number
): {
  readonly hourlyAq: readonly HourlyAirQualityPoint[];
  readonly hourlyWeather: readonly HourlyWeatherPoint[];
} {
  const hourlyAq: HourlyAirQualityPoint[] = [];
  const hourlyWeather: HourlyWeatherPoint[] = [];
  const baseDate = new Date('2026-11-24T00:00:00Z');

  for (let i = 0; i < 48; i++) {
    const pointTime = new Date(baseDate.getTime() + i * 3600 * 1000).toISOString();
    const hour = i % 24;
    const factor = DIURNAL_PM25_FACTORS[hour] ?? 1.0;
    const pm25 = Math.round(basePm25 * factor);
    const pm10 = Math.round(pm25 * 1.6);
    const aqiRes = calculateAqi(pm25, pm10);

    hourlyAq.push({
      time: pointTime,
      aqi: aqiRes.aqi,
      category: aqiRes.category,
      pm2_5: pm25,
      pm10,
      isEstimate: true,
    });

    hourlyWeather.push({
      time: pointTime,
      temperature: Math.round((baseTemp + (hour >= 10 && hour <= 16 ? 4 : -3)) * 10) / 10,
      humidity: Math.min(95, Math.round(baseHumidity * (factor > 1.1 ? 1.15 : 0.85))),
      windSpeed: Math.max(0.3, Math.round(baseWind * (factor > 1.1 ? 0.7 : 1.3) * 10) / 10),
      surfacePressure: 1014,
    });
  }

  return { hourlyAq, hourlyWeather };
}
