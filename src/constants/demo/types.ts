// Types for curated demo snapshots, household personas, and diurnal projections.
import type { AqiCategory } from '../../domain/types.js';
import type {
  HourlyAirQualityPoint,
  HourlyWeatherPoint,
} from '../../services/openMeteo.types.js';

export type DemoCityId = 'delhi' | 'lucknow' | 'mumbai' | 'bengaluru';
export type DemoPersonaId = 'toddler_grandparent' | 'commuter_couple' | 'school_rwa';

export interface DemoSnapshotPollutants {
  readonly pm2_5: number;
  readonly pm10: number;
  readonly no2: number;
  readonly so2: number;
  readonly co: number;
  readonly o3: number;
}

export interface DemoSnapshotWeather {
  readonly temperature: number;
  readonly humidity: number;
  readonly windSpeed: number;
  readonly pressure: number;
}

export interface DemoSnapshot {
  readonly cityId: DemoCityId | string;
  readonly cityName: string;
  readonly aqi: number;
  readonly category: AqiCategory;
  readonly dominantPollutant: string;
  readonly pollutants: DemoSnapshotPollutants;
  readonly weather: DemoSnapshotWeather;
  readonly hourlyAirQuality: readonly HourlyAirQualityPoint[];
  readonly hourlyWeather: readonly HourlyWeatherPoint[];
  readonly hourly?: {
    readonly time: readonly string[];
    readonly pm2_5: readonly number[];
    readonly pm10: readonly number[];
  };
  readonly isEstimate: true;
  readonly source: 'curated frozen demo snapshot';
}

export interface DemoPersona {
  readonly id: DemoPersonaId | string;
  readonly name: string;
  readonly vulnerabilities: readonly string[];
  readonly activityLevel: string;
  readonly transitMode: string;
  readonly hasPurifier?: boolean;
  readonly description?: string;
}
