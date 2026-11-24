// CPCB National Air Quality Index calculation and breakpoint interpolation.
import type { AqiCategory, AqiResult, Breakpoint, Pollutant } from './types.js';

/** CPCB standard concentration breakpoints for PM2.5 (ug/m3). */
export const PM25_BREAKPOINTS: readonly Breakpoint[] = [
  { cLo: 0, cHi: 30, iLo: 0, iHi: 50, category: 'Good' },
  { cLo: 31, cHi: 60, iLo: 51, iHi: 100, category: 'Satisfactory' },
  { cLo: 61, cHi: 90, iLo: 101, iHi: 200, category: 'Moderate' },
  { cLo: 91, cHi: 120, iLo: 201, iHi: 300, category: 'Poor' },
  { cLo: 121, cHi: 250, iLo: 301, iHi: 400, category: 'Very Poor' },
  { cLo: 251, cHi: 380, iLo: 401, iHi: 500, category: 'Severe' },
];

/** CPCB standard concentration breakpoints for PM10 (ug/m3). */
export const PM10_BREAKPOINTS: readonly Breakpoint[] = [
  { cLo: 0, cHi: 50, iLo: 0, iHi: 50, category: 'Good' },
  { cLo: 51, cHi: 100, iLo: 51, iHi: 100, category: 'Satisfactory' },
  { cLo: 101, cHi: 250, iLo: 101, iHi: 200, category: 'Moderate' },
  { cLo: 251, cHi: 350, iLo: 201, iHi: 300, category: 'Poor' },
  { cLo: 351, cHi: 430, iLo: 301, iHi: 400, category: 'Very Poor' },
  { cLo: 431, cHi: 500, iLo: 401, iHi: 500, category: 'Severe' },
];

/**
 * Maps a calculated AQI integer into its CPCB category descriptor.
 *
 * @param aqi - Integer Air Quality Index value.
 * @returns CPCB category name.
 */
export function getAqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

/**
 * Calculates CPCB sub-index for a single pollutant concentration.
 *
 * @param concentration - Pollutant concentration in ug/m3.
 * @param pollutant - Criteria pollutant type ('PM2.5' or 'PM10').
 * @returns Clamped sub-index integer (0 to 500).
 */
export function calculateSubIndex(concentration: number, pollutant: Pollutant): number {
  const c = Math.round(Math.max(0, concentration));
  const breakpoints = pollutant === 'PM2.5' ? PM25_BREAKPOINTS : PM10_BREAKPOINTS;
  const maxBp = breakpoints[breakpoints.length - 1];

  if (c >= maxBp.cHi) {
    return 500;
  }

  const bp = breakpoints.find((b) => c <= b.cHi)!;
  const cOffset = Math.max(0, c - bp.cLo);
  const deltaC = bp.cHi - bp.cLo;
  const deltaI = bp.iHi - bp.iLo;

  const raw = ((deltaI / deltaC) * cOffset) + bp.iLo;
  return Math.min(500, Math.max(0, Math.round(raw)));
}

/**
 * Calculates composite CPCB Air Quality Index from PM2.5 and optional PM10.
 *
 * @param pm25 - Fine particulate matter PM2.5 concentration in ug/m3.
 * @param pm10 - Optional coarse particulate matter PM10 concentration in ug/m3.
 * @returns Complete AQI computation result with dominant pollutant and estimate flag.
 */
export function calculateAqi(pm25: number, pm10?: number): AqiResult {
  const pm25SubIndex = calculateSubIndex(pm25, 'PM2.5');
  const pm10SubIndex = pm10 !== undefined ? calculateSubIndex(pm10, 'PM10') : undefined;

  let aqi = pm25SubIndex;
  let dominantPollutant: Pollutant = 'PM2.5';

  if (pm10SubIndex !== undefined && pm10SubIndex > pm25SubIndex) {
    aqi = pm10SubIndex;
    dominantPollutant = 'PM10';
  }

  return {
    aqi,
    category: getAqiCategory(aqi),
    dominantPollutant,
    isEstimate: true,
    pm25SubIndex,
    pm10SubIndex,
  };
}
