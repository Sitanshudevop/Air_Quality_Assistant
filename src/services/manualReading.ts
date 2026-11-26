// Manual reading ingestion and inverse CPCB pollutant estimation fallback.
import { z } from 'zod';
import { calculateAqi } from '../domain/aqi.js';
import type { AqiCategory } from '../domain/types.js';
import { getErrorMessage } from '../utils/error.js';
import { logError } from '../utils/logger.js';

const MANUAL_READING_KEY = 'saans_manual_reading';

/** Zod schema validating persisted manual AQI reading in sessionStorage. */
export const manualReadingSchema = z.object({
  aqi: z.number().finite().min(0).max(500),
  pm25: z.number().finite().min(0),
  category: z.enum(['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe']),
  source: z.literal('user-entered reading'),
  sourceLabel: z.literal('user-entered reading'),
  isEstimate: z.literal(true),
  enteredAt: z.string().min(1).max(40),
  cityName: z.string().trim().min(1).max(100),
});

export interface ManualReadingInput {
  readonly aqi?: number | string;
  readonly pm25?: number | string;
  readonly cityName?: string;
}

export interface ManualAirQualityData {
  readonly aqi: number;
  readonly pm25: number;
  readonly category: AqiCategory;
  readonly source: 'user-entered reading';
  readonly sourceLabel: 'user-entered reading';
  readonly isEstimate: true;
  readonly enteredAt: string;
  readonly cityName: string;
}

const PM25_BREAKPOINTS = [
  { cLo: 0, cHi: 30, iLo: 0, iHi: 50, cat: 'Good' as AqiCategory },
  { cLo: 31, cHi: 60, iLo: 51, iHi: 100, cat: 'Satisfactory' as AqiCategory },
  { cLo: 61, cHi: 90, iLo: 101, iHi: 200, cat: 'Moderate' as AqiCategory },
  { cLo: 91, cHi: 120, iLo: 201, iHi: 300, cat: 'Poor' as AqiCategory },
  { cLo: 121, cHi: 250, iLo: 301, iHi: 400, cat: 'Very Poor' as AqiCategory },
  { cLo: 251, cHi: 500, iLo: 401, iHi: 500, cat: 'Severe' as AqiCategory },
];

let manualStore: ManualAirQualityData | null = null;

/**
 * Estimates PM2.5 concentration from AQI using inverse breakpoint interpolation.
 *
 * @param aqi - Clamped AQI value between 0 and 500.
 * @returns Estimated PM2.5 concentration in µg/m³.
 */
function estimatePm25FromAqi(aqi: number): { pm25: number; category: AqiCategory } {
  if (aqi <= 0) return { pm25: 0, category: 'Good' };
  for (const b of PM25_BREAKPOINTS) {
    if (aqi <= b.iHi) {
      const frac = (aqi - b.iLo) / Math.max(1, b.iHi - b.iLo);
      const pm25 = Math.round(b.cLo + frac * (b.cHi - b.cLo));
      return { pm25, category: b.cat };
    }
  }
  return { pm25: 500, category: 'Severe' };
}

/**
 * Parses numeric input safely, clamping between 0 and 500.
 *
 * @param raw - Input value as number, string, or undefined.
 * @returns Clamped integer number.
 */
function parseSafeAqi(raw: unknown): number {
  const num = typeof raw === 'number' ? raw : Number(raw);
  if (Number.isNaN(num) || num < 0) return 0;
  return Math.min(500, Math.round(num));
}

function formatCityName(cityName?: string): string {
  const trimmed = typeof cityName === 'string' ? cityName.trim().slice(0, 100) : '';
  return trimmed || 'Custom Location';
}

/**
 * Creates a verified manual air quality reading from purifier or app AQI.
 *
 * @param input - Reading input with AQI or PM2.5.
 * @returns Structured ManualAirQualityData object.
 */
export function createManualReading(input: ManualReadingInput): ManualAirQualityData {
  if (input.pm25 !== undefined && input.aqi === undefined) {
    const rawPm25 = typeof input.pm25 === 'number' ? input.pm25 : Number(input.pm25);
    return createManualReadingFromPm25(Number.isFinite(rawPm25) ? rawPm25 : 0, input.cityName);
  }

  const safeAqi = parseSafeAqi(input.aqi);
  const { pm25, category } = estimatePm25FromAqi(safeAqi);

  return {
    aqi: safeAqi,
    pm25,
    category,
    source: 'user-entered reading',
    sourceLabel: 'user-entered reading',
    isEstimate: true,
    enteredAt: new Date().toISOString(),
    cityName: formatCityName(input.cityName),
  };
}

/**
 * Creates a manual air quality reading directly from a PM2.5 measurement.
 *
 * @param pm25 - PM2.5 concentration in µg/m³.
 * @param cityName - Optional name of the location.
 * @returns Structured ManualAirQualityData object.
 */
export function createManualReadingFromPm25(
  pm25: number,
  cityName?: string
): ManualAirQualityData {
  const safePm25 = Math.max(0, Number.isFinite(pm25) ? pm25 : 0);
  const aqiResult = calculateAqi(safePm25);

  return {
    aqi: aqiResult.aqi,
    pm25: safePm25,
    category: aqiResult.category,
    source: 'user-entered reading',
    sourceLabel: 'user-entered reading',
    isEstimate: true,
    enteredAt: new Date().toISOString(),
    cityName: formatCityName(cityName),
  };
}

/**
 * Saves manual reading into active memory and session storage.
 *
 * @param reading - Manual reading dataset to persist.
 */
export function saveManualReading(reading: ManualAirQualityData): void {
  manualStore = reading;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(MANUAL_READING_KEY, JSON.stringify(reading));
    }
  } catch (err) {
    logError('Failed saving manual reading to sessionStorage', {
      action: 'saveManualReading',
      error: getErrorMessage(err),
    });
  }
}

/**
 * Retrieves the persisted manual reading if available.
 *
 * @returns Active ManualAirQualityData or null.
 */
export function getManualReading(): ManualAirQualityData | null {
  if (manualStore) return manualStore;
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(MANUAL_READING_KEY);
    if (!raw) return null;
    const parsed = manualReadingSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      logError('Invalid manual reading cleared from sessionStorage', {
        action: 'getManualReading',
        error: parsed.error.message,
      });
      window.sessionStorage.removeItem(MANUAL_READING_KEY);
      return null;
    }
    return parsed.data;
  } catch (err) {
    logError('Failed parsing manual reading from sessionStorage', {
      action: 'getManualReading',
      error: getErrorMessage(err),
    });
    try {
      window.sessionStorage.removeItem(MANUAL_READING_KEY);
    } catch {
      // ignore
    }
    return null;
  }
}

/**
 * Clears any stored manual air quality reading.
 */
export function clearManualReading(): void {
  manualStore = null;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(MANUAL_READING_KEY);
    }
  } catch (err) {
    logError('Failed clearing manual reading from sessionStorage', {
      action: 'clearManualReading',
      error: getErrorMessage(err),
    });
  }
}
