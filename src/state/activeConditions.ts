// Resolves active air quality conditions and profile context across Demo, Live, and Manual modes.
import { DEMO_PERSONAS } from '../constants/demo/personas.js';
import { getSnapshot } from '../constants/demo/snapshots.js';
import type { DemoCityId, DemoPersonaId } from '../constants/demo/types.js';
import type { AqiCategory } from '../domain/types.js';
import type { ManualAirQualityData } from '../services/manualReading.js';
import type { AirQualityData, ForecastData, HourlyAirQualityPoint, WeatherFactors } from '../services/openMeteo.types.js';
import type { StoredProfile } from '../services/profile.types.js';
import { getProfile } from '../services/profile.js';
import type { PollutantValues } from '../features/dashboard/PollutantCard.js';

/** Unified active environmental snapshot passed to Today and M5 feature tabs. */
export interface ActiveConditions {
  readonly cityName: string;
  readonly aqi: number;
  readonly category: AqiCategory;
  readonly dominantPollutant: string;
  readonly pollutants: PollutantValues;
  readonly weatherFactors: Partial<WeatherFactors>;
  readonly hourlyPoints: readonly HourlyAirQualityPoint[];
  readonly sourceLabel: string;
  readonly pm25: number;
}

function buildDemoConditions(demoCityId: DemoCityId): ActiveConditions {
  const snap = getSnapshot(demoCityId);
  return {
    cityName: snap.cityName,
    aqi: snap.aqi,
    category: snap.category,
    dominantPollutant: snap.dominantPollutant,
    pollutants: snap.pollutants,
    weatherFactors: snap.weather,
    hourlyPoints: snap.hourlyAirQuality,
    sourceLabel: `Curated Demo Snapshot (${snap.cityName})`,
    pm25: snap.pollutants.pm2_5,
  };
}

function buildManualConditions(m: ManualAirQualityData): ActiveConditions {
  return {
    cityName: m.cityName,
    aqi: m.aqi,
    category: m.category,
    dominantPollutant: 'PM2.5',
    pollutants: { pm2_5: m.pm25 },
    weatherFactors: {},
    hourlyPoints: [],
    sourceLabel: m.sourceLabel,
    pm25: m.pm25,
  };
}

function buildLiveConditions(
  liveData: { aq: AirQualityData; label: string },
  liveForecast: ForecastData | null
): ActiveConditions {
  const { aq, label } = liveData;
  return {
    cityName: label,
    aqi: aq.currentAqi,
    category: aq.currentCategory,
    dominantPollutant: aq.dominantPollutant,
    pollutants: aq.pollutants,
    weatherFactors: liveForecast?.current ?? {},
    hourlyPoints: aq.hourly,
    sourceLabel: aq.source,
    pm25: aq.pollutants.pm2_5,
  };
}

/**
 * Resolves unified air quality conditions without ever substituting demo data in live mode.
 *
 * @param params - Operating mode flag, demo city ID, optional live API data, and manual reading.
 * @returns Normalized ActiveConditions object for UI rendering.
 */
export function resolveActiveConditions(params: {
  readonly isDemo: boolean;
  readonly demoCityId: DemoCityId;
  readonly liveData: { aq: AirQualityData; label: string } | null;
  readonly liveForecast: ForecastData | null;
  readonly manualData: ManualAirQualityData | null;
}): ActiveConditions {
  if (params.isDemo) return buildDemoConditions(params.demoCityId);
  if (params.manualData) return buildManualConditions(params.manualData);
  if (params.liveData) return buildLiveConditions(params.liveData, params.liveForecast);
  return {
    cityName: 'Live City Search Required',
    aqi: 0,
    category: 'Good',
    dominantPollutant: 'PM2.5',
    pollutants: { pm2_5: 0 },
    weatherFactors: {},
    hourlyPoints: [],
    sourceLabel: 'Awaiting live Open-Meteo city selection or manual reading',
    pm25: 0,
  };
}

/**
 * Resolves effective household profile from stored profile or active demo persona.
 *
 * @param isDemo - Whether application is in demo mode.
 * @param demoPersonaId - Selected demo persona identifier.
 * @returns StoredProfile-shaped preference object.
 */
export function resolveEffectiveProfile(isDemo: boolean, demoPersonaId: DemoPersonaId): StoredProfile {
  const saved = getProfile();
  if (!isDemo) return saved;
  const persona = DEMO_PERSONAS[demoPersonaId];
  return {
    ...saved,
    commuteMode: persona.transitMode,
    vulnerabilities: [...persona.vulnerabilities],
    vulnerability: undefined,
    hasPurifier: Boolean(persona.hasPurifier),
  };
}
