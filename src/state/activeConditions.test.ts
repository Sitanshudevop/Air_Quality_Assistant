// Unit tests for activeConditions resolution across Demo, Live, Manual, and empty profile states.
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveActiveConditions, resolveEffectiveProfile } from './activeConditions.js';
import { clearProfile, saveProfile } from '../services/profile.js';
import { mapStoredProfileToDomain } from '../features/routine/routineUtils.js';
import type { AirQualityData, ForecastData } from '../services/openMeteo.types.js';
import type { ManualAirQualityData } from '../services/manualReading.js';

const SAMPLE_AQ: AirQualityData = {
  latitude: 28.61,
  longitude: 77.21,
  currentAqi: 240,
  currentCategory: 'Poor',
  dominantPollutant: 'PM2.5',
  isEstimate: true,
  pollutants: { pm2_5: 102, pm10: 180, no2: 45 },
  hourly: [],
  source: 'Open-Meteo CAMS',
  fetchedAt: '2026-11-26T00:00:00Z',
};

const SAMPLE_FORECAST: ForecastData = {
  latitude: 28.61,
  longitude: 77.21,
  current: {
    temperature: 19,
    humidity: 72,
    windSpeed: 1.4,
    surfacePressure: 1015,
    stagnationRisk: 'high',
    isInversion: false,
    summary: 'Light breeze provides minimal pollutant dispersion.',
  },
  hourly: [],
  fetchedAt: '2026-11-26T00:00:00Z',
};

const SAMPLE_MANUAL: ManualAirQualityData = {
  aqi: 310,
  pm25: 132,
  category: 'Very Poor',
  source: 'user-entered reading',
  sourceLabel: 'user-entered reading',
  isEstimate: true,
  enteredAt: '2026-11-26T00:00:00Z',
  cityName: 'Noida',
};

describe('activeConditions state resolution', () => {
  beforeEach(() => {
    clearProfile();
  });

  it('resolves demo snapshot conditions when isDemo is true', () => {
    const cond = resolveActiveConditions({
      isDemo: true,
      demoCityId: 'delhi',
      liveData: null,
      liveForecast: null,
      manualData: null,
    });
    expect(cond.cityName).toBe('Delhi');
    expect(cond.sourceLabel).toContain('Curated Demo Snapshot');
    expect(cond.hourlyPoints.length).toBeGreaterThan(0);
  });

  it('resolves manual reading conditions in live mode when manualData is set', () => {
    const cond = resolveActiveConditions({
      isDemo: false,
      demoCityId: 'delhi',
      liveData: { aq: SAMPLE_AQ, label: 'Delhi' },
      liveForecast: SAMPLE_FORECAST,
      manualData: SAMPLE_MANUAL,
    });
    expect(cond.cityName).toBe('Noida');
    expect(cond.aqi).toBe(310);
    expect(cond.sourceLabel).toBe('user-entered reading');
  });

  it('resolves live conditions with forecast present and with null forecast', () => {
    const withForecast = resolveActiveConditions({
      isDemo: false,
      demoCityId: 'delhi',
      liveData: { aq: SAMPLE_AQ, label: 'Delhi, India' },
      liveForecast: SAMPLE_FORECAST,
      manualData: null,
    });
    expect(withForecast.cityName).toBe('Delhi, India');
    expect(withForecast.aqi).toBe(240);
    expect(withForecast.weatherFactors.stagnationRisk).toBe('high');

    const withoutForecast = resolveActiveConditions({
      isDemo: false,
      demoCityId: 'delhi',
      liveData: { aq: SAMPLE_AQ, label: 'Delhi, India' },
      liveForecast: null,
      manualData: null,
    });
    expect(withoutForecast.weatherFactors).toEqual({});
    expect(withoutForecast.pm25).toBe(102);
  });

  it('returns awaiting search placeholder in live mode without live or manual data', () => {
    const cond = resolveActiveConditions({
      isDemo: false,
      demoCityId: 'delhi',
      liveData: null,
      liveForecast: null,
      manualData: null,
    });
    expect(cond.cityName).toBe('Live City Search Required');
    expect(cond.aqi).toBe(0);
    expect(cond.category).toBe('Good');
  });

  it('resolves stored profile in live mode, persona overlay in demo mode, and empty {} fallback', () => {
    saveProfile({ cityName: 'Jaipur', commuteMode: 'metro', hasPurifier: true });
    const liveProf = resolveEffectiveProfile(false, 'toddler_grandparent');
    expect(liveProf.cityName).toBe('Jaipur');
    expect(liveProf.commuteMode).toBe('metro');

    const demoProf = resolveEffectiveProfile(true, 'toddler_grandparent');
    expect(demoProf.vulnerability).toBeUndefined();
    expect(Array.isArray(demoProf.vulnerabilities)).toBe(true);

    const domainEmpty = mapStoredProfileToDomain({});
    expect(domainEmpty).toEqual({
      vulnerability: 'healthy_adult',
      commuteMode: undefined,
      hasPurifier: false,
      cookingFuel: 'lpg',
    });
  });
});
