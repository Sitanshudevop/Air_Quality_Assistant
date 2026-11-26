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

export type DataStatus = 'empty' | 'loading' | 'ready' | 'error';
export type DataOrigin = 'live' | 'demo' | 'manual';

/** Unified active environmental snapshot passed to Today and M5 feature tabs. */
export interface ActiveConditions {
  readonly status: DataStatus;
  readonly origin: DataOrigin;
  readonly cityName?: string;
  readonly aqi?: number;
  readonly category?: AqiCategory;
  readonly dominantPollutant?: string;
  readonly pollutants?: PollutantValues;
  readonly weatherFactors?: Partial<WeatherFactors>;
  readonly hourlyPoints: readonly HourlyAirQualityPoint[];
  readonly sourceLabel?: string;
  readonly pm25?: number;
  readonly timestamp?: string;
  readonly isEstimate?: boolean;
  readonly errorMessage?: string;
}

function buildDemoConditions(demoCityId: DemoCityId): ActiveConditions {
  const snap = getSnapshot(demoCityId);
  return {
    status: 'ready',
    origin: 'demo',
    cityName: snap.cityName,
    aqi: snap.aqi,
    category: snap.category,
    dominantPollutant: snap.dominantPollutant,
    pollutants: snap.pollutants,
    weatherFactors: snap.weather,
    hourlyPoints: snap.hourlyAirQuality,
    sourceLabel: `Curated Demo Snapshot (${snap.cityName})`,
    pm25: snap.pollutants.pm2_5,
    timestamp: '24 Nov 2026, 08:30 IST',
    isEstimate: true,
  };
}

function buildManualConditions(m: ManualAirQualityData): ActiveConditions {
  return {
    status: 'ready',
    origin: 'manual',
    cityName: m.cityName,
    aqi: m.aqi,
    category: m.category,
    dominantPollutant: 'PM2.5',
    pollutants: { pm2_5: m.pm25 },
    weatherFactors: undefined,
    hourlyPoints: [],
    sourceLabel: m.sourceLabel,
    pm25: m.pm25,
    timestamp: m.enteredAt || undefined,
    isEstimate: false,
  };
}

function buildLiveConditions(
  liveData: { aq: AirQualityData; label: string },
  liveForecast: ForecastData | null
): ActiveConditions {
  const { aq, label } = liveData;
  return {
    status: 'ready',
    origin: 'live',
    cityName: label,
    aqi: aq.currentAqi,
    category: aq.currentCategory,
    dominantPollutant: aq.dominantPollutant,
    pollutants: aq.pollutants,
    weatherFactors: liveForecast?.current,
    hourlyPoints: aq.hourly,
    sourceLabel: aq.source,
    pm25: aq.pollutants.pm2_5,
    timestamp: aq.fetchedAt || undefined,
    isEstimate: aq.isEstimate,
  };
}

/** Parameters for condition resolution. */
export interface ResolveConditionsParams {
  readonly isDemo: boolean;
  readonly demoCityId: DemoCityId;
  readonly liveData: { aq: AirQualityData; label: string } | null;
  readonly liveForecast: ForecastData | null;
  readonly manualData: ManualAirQualityData | null;
  readonly isLoading?: boolean;
  readonly error?: string | null;
}

/**
 * Resolves unified air quality conditions without ever substituting demo data in live mode.
 *
 * @param params - Operating mode flag, demo city ID, optional live API data, and manual reading.
 * @returns Normalized ActiveConditions object for UI rendering.
 */
export function resolveActiveConditions(params: ResolveConditionsParams): ActiveConditions {
  if (params.isDemo) return buildDemoConditions(params.demoCityId);
  if (params.manualData) return buildManualConditions(params.manualData);
  if (params.liveData) return buildLiveConditions(params.liveData, params.liveForecast);
  if (params.isLoading) {
    return { status: 'loading', origin: 'live', hourlyPoints: [] };
  }
  if (params.error) {
    return { status: 'error', origin: 'live', hourlyPoints: [], errorMessage: params.error };
  }
  return {
    status: 'empty',
    origin: 'live',
    hourlyPoints: [],
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
