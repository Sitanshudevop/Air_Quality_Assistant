// Manual reading ingestion and inverse CPCB pollutant estimation fallback.
import { calculateAqi } from '../domain/aqi.js';
import type { AqiCategory } from '../domain/types.js';

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

/**
 * Creates a verified manual air quality reading from purifier or app AQI.
 *
 * @param input - Reading input with AQI or PM2.5.
 * @returns Structured ManualAirQualityData object.
 */
export function createManualReading(input: ManualReadingInput): ManualAirQualityData {
  if (input.pm25 !== undefined && input.aqi === undefined) {
    const rawPm25 = typeof input.pm25 === 'number' ? input.pm25 : Number(input.pm25);
    return createManualReadingFromPm25(Number.isNaN(rawPm25) ? 0 : rawPm25, input.cityName);
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
    cityName: input.cityName ?? 'Custom Location',
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
  const safePm25 = Math.max(0, Number.isNaN(pm25) ? 0 : pm25);
  const aqiResult = calculateAqi(safePm25);

  return {
    aqi: aqiResult.aqi,
    pm25: safePm25,
    category: aqiResult.category,
    source: 'user-entered reading',
    sourceLabel: 'user-entered reading',
    isEstimate: true,
    enteredAt: new Date().toISOString(),
    cityName: cityName ?? 'Custom Location',
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
      window.sessionStorage.setItem('saans_manual_reading', JSON.stringify(reading));
    }
  } catch {
    // ignore
  }
}

/**
 * Retrieves the persisted manual reading if available.
 *
 * @returns Active ManualAirQualityData or null.
 */
export function getManualReading(): ManualAirQualityData | null {
  if (manualStore) return manualStore;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = window.sessionStorage.getItem('saans_manual_reading');
      if (raw) return JSON.parse(raw) as ManualAirQualityData;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Clears any stored manual air quality reading.
 */
export function clearManualReading(): void {
  manualStore = null;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem('saans_manual_reading');
    }
  } catch {
    // ignore
  }
}
