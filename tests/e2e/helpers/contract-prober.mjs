/**
 * Contract Prober and Reference Domain Oracle for Saans E2E Tests.
 * Facilitates opaque-box probing, safe dynamic module importing,
 * and authoritative reference calculations for all 30 features.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { WORKSPACE_ROOT } from './workspace-inspect.mjs';

/**
 * Safely loads a TypeScript or JavaScript module from workspace relative path.
 * Returns null if file does not exist or fails to load.
 *
 * @param {string} relPath - Relative file path (e.g. 'src/domain/aqi.ts')
 * @returns {Promise<any | null>}
 */
export async function loadModuleSafe(relPath) {
  try {
    let fullPath = path.resolve(WORKSPACE_ROOT, relPath);
    if (!fs.existsSync(fullPath)) {
      if (fs.existsSync(fullPath + '.ts')) fullPath += '.ts';
      else if (fs.existsSync(fullPath + '.tsx')) fullPath += '.tsx';
      else if (fs.existsSync(fullPath + '.js')) fullPath += '.js';
      else return null;
    }
    const fileUrl = pathToFileURL(fullPath).href;
    return await import(`${fileUrl}?t=${Date.now()}`);
  } catch {
    return null;
  }
}

/**
 * Authoritative CPCB AQI Calculation (Indian National Air Quality Index standard).
 * Evaluates piecewise linear breakpoint interpolation for PM2.5 and PM10.
 *
 * @param {number} pm25 - PM2.5 concentration in µg/m³
 * @param {number} [pm10] - PM10 concentration in µg/m³
 * @returns {{ aqi: number, category: string, dominantPollutant: string, isEstimate: boolean }}
 */
export function referenceCalculateAqi(pm25, pm10) {
  const safePm25 = Math.max(0, Number(pm25) || 0);
  const safePm10 = pm10 !== undefined ? Math.max(0, Number(pm10) || 0) : undefined;

  const pm25Breakpoints = [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
    { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
    { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 }
  ];

  const pm10Breakpoints = [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 431, cHigh: 500, iLow: 401, iHigh: 500 }
  ];

  function calcSubIndex(c, bps) {
    if (c <= 0) return 0;
    for (const b of bps) {
      if (c <= b.cHigh) {
        const sub = b.iLow + ((b.iHigh - b.iLow) / (b.cHigh - b.cLow)) * (c - b.cLow);
        return Math.min(500, Math.round(sub));
      }
    }
    return 500;
  }

  const aqiPm25 = calcSubIndex(safePm25, pm25Breakpoints);
  const aqiPm10 = safePm10 !== undefined ? calcSubIndex(safePm10, pm10Breakpoints) : 0;

  const aqi = Math.max(aqiPm25, aqiPm10);
  const dominantPollutant = aqiPm10 > aqiPm25 ? 'PM10' : 'PM2.5';

  let category = 'Good';
  if (aqi > 400) category = 'Severe';
  else if (aqi > 300) category = 'Very Poor';
  else if (aqi > 200) category = 'Poor';
  else if (aqi > 100) category = 'Moderate';
  else if (aqi > 50) category = 'Satisfactory';

  return {
    aqi,
    category,
    dominantPollutant,
    isEstimate: true
  };
}

/**
 * Authoritative Inhaled Dose Reference Model.
 *
 * @param {object} params
 * @param {number} params.pm25
 * @param {number} params.durationMinutes
 * @param {string} [params.maskType] - 'none' | 'cloth' | 'surgical' | 'n95'
 * @param {string} [params.activityLevel] - 'rest' | 'light' | 'moderate' | 'heavy'
 * @param {string} [params.environment] - 'indoor' | 'outdoor' | 'transit'
 * @param {string} [params.vulnerabilityGroup] - 'general' | 'child' | 'elderly' | 'asthmatic'
 * @returns {{ relativeDose: number, baselineDose: number, percentageChange: number, uncertaintyRange: [number, number] }}
 */
export function referenceCalculateRelativeDose(params) {
  const pm25 = Math.max(0, Number(params.pm25) || 0);
  const duration = Math.max(0, Number(params.durationMinutes) || 0);

  const maskEff = {
    none: 0.0,
    cloth: 0.30,
    surgical: 0.60,
    n95: 0.95
  }[params.maskType || 'none'] ?? 0.0;

  const ventRate = {
    rest: 0.5,
    light: 1.0,
    moderate: 2.0,
    heavy: 3.5
  }[params.activityLevel || 'light'] ?? 1.0;

  const envFactor = {
    indoor: 0.6,
    transit: 1.2,
    outdoor: 1.0
  }[params.environment || 'outdoor'] ?? 1.0;

  const vulFactor = {
    general: 1.0,
    child: 1.4,
    elderly: 1.3,
    asthmatic: 1.5
  }[params.vulnerabilityGroup || 'general'] ?? 1.0;

  const baselineDose = pm25 * ventRate * duration * envFactor * vulFactor;
  const relativeDose = baselineDose * (1 - maskEff);
  const percentageChange = baselineDose > 0
    ? Math.round(((relativeDose - baselineDose) / baselineDose) * 100)
    : 0;

  const lowBound = Math.round(percentageChange * 0.85);
  const highBound = Math.round(percentageChange * 1.15);
  const uncertaintyRange = [Math.min(lowBound, highBound), Math.max(lowBound, highBound)];

  return {
    relativeDose: Math.round(relativeDose * 100) / 100,
    baselineDose: Math.round(baselineDose * 100) / 100,
    percentageChange,
    uncertaintyRange
  };
}

/**
 * Standard Curated Demo Snapshots.
 */
export const REFERENCE_DEMO_SNAPSHOTS = {
  delhi: {
    cityId: 'delhi',
    cityName: 'Delhi',
    aqi: 425,
    category: 'Severe',
    dominantPollutant: 'PM2.5',
    pollutants: { pm2_5: 380, pm10: 510, no2: 85, so2: 24, co: 2.4, o3: 35 },
    weather: { temperature: 16, humidity: 82, windSpeed: 0.8, pressure: 1016 }
  },
  lucknow: {
    cityId: 'lucknow',
    cityName: 'Lucknow',
    aqi: 260,
    category: 'Poor',
    dominantPollutant: 'PM2.5',
    pollutants: { pm2_5: 110, pm10: 190, no2: 52, so2: 18, co: 1.6, o3: 42 },
    weather: { temperature: 18, humidity: 75, windSpeed: 1.4, pressure: 1015 }
  },
  mumbai: {
    cityId: 'mumbai',
    cityName: 'Mumbai',
    aqi: 135,
    category: 'Moderate',
    dominantPollutant: 'PM2.5',
    pollutants: { pm2_5: 48, pm10: 95, no2: 38, so2: 12, co: 0.9, o3: 28 },
    weather: { temperature: 28, humidity: 68, windSpeed: 3.8, pressure: 1012 }
  },
  bengaluru: {
    cityId: 'bengaluru',
    cityName: 'Bengaluru',
    aqi: 45,
    category: 'Good',
    dominantPollutant: 'PM2.5',
    pollutants: { pm2_5: 18, pm10: 38, no2: 22, so2: 8, co: 0.5, o3: 22 },
    weather: { temperature: 22, humidity: 55, windSpeed: 4.2, pressure: 1014 }
  }
};

/**
 * Standard Curated Personas.
 */
export const REFERENCE_PERSONAS = {
  toddler_grandparent: {
    id: 'toddler_grandparent',
    name: 'Toddler & Asthmatic Grandparent',
    vulnerabilities: ['child', 'asthmatic'],
    activityLevel: 'rest',
    transitMode: 'car'
  },
  commuter_couple: {
    id: 'commuter_couple',
    name: 'Two-Wheeler Commuter Couple',
    vulnerabilities: ['general'],
    activityLevel: 'moderate',
    transitMode: 'two-wheeler'
  },
  school_rwa: {
    id: 'school_rwa',
    name: 'School & RWA Administrator',
    vulnerabilities: ['child', 'elderly'],
    activityLevel: 'light',
    transitMode: 'metro'
  }
};
