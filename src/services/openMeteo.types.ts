// Types for Open-Meteo Air Quality, Weather Forecast, and Geocoding APIs.
import type { AqiCategory } from '../domain/types.js';

/** Raw hourly data returned by Open-Meteo Air Quality API. */
export interface RawAirQualityHourly {
  readonly time: readonly string[];
  readonly pm10?: readonly (number | null)[];
  readonly pm2_5?: readonly (number | null)[];
  readonly carbon_monoxide?: readonly (number | null)[];
  readonly nitrogen_dioxide?: readonly (number | null)[];
  readonly sulphur_dioxide?: readonly (number | null)[];
  readonly ozone?: readonly (number | null)[];
}

/** Raw current air quality pollutant snapshot. */
export interface RawAirQualityCurrent {
  readonly time?: string;
  readonly pm10?: number | null;
  readonly pm2_5?: number | null;
  readonly carbon_monoxide?: number | null;
  readonly nitrogen_dioxide?: number | null;
  readonly sulphur_dioxide?: number | null;
  readonly ozone?: number | null;
}

/** Raw Open-Meteo Air Quality response payload. */
export interface RawAirQualityResponse {
  readonly latitude: number;
  readonly longitude: number;
  readonly generationtime_ms?: number;
  readonly timezone?: string;
  readonly current?: RawAirQualityCurrent;
  readonly hourly: RawAirQualityHourly;
}

/** Hourly air quality prediction point with calculated CPCB AQI. */
export interface HourlyAirQualityPoint {
  readonly time: string;
  readonly aqi: number;
  readonly category: AqiCategory;
  readonly pm2_5: number;
  readonly pm10?: number;
  readonly no2?: number;
  readonly so2?: number;
  readonly co?: number;
  readonly o3?: number;
  readonly isEstimate: boolean;
}

/** Transformed application air quality dataset. */
export interface AirQualityData {
  readonly latitude: number;
  readonly longitude: number;
  readonly currentAqi: number;
  readonly currentCategory: AqiCategory;
  readonly dominantPollutant: string;
  readonly isEstimate: boolean;
  readonly pollutants: {
    readonly pm2_5: number;
    readonly pm10?: number;
    readonly no2?: number;
    readonly so2?: number;
    readonly co?: number;
    readonly o3?: number;
  };
  readonly hourly: readonly HourlyAirQualityPoint[];
  readonly source: string;
  readonly fetchedAt: string;
}

/** Raw hourly weather data from Open-Meteo Forecast API. */
export interface RawWeatherHourly {
  readonly time: readonly string[];
  readonly temperature_2m?: readonly (number | null)[];
  readonly relative_humidity_2m?: readonly (number | null)[];
  readonly surface_pressure?: readonly (number | null)[];
  readonly wind_speed_10m?: readonly (number | null)[];
}

/** Raw current weather parameters from Open-Meteo Forecast API. */
export interface RawWeatherCurrent {
  readonly time?: string;
  readonly temperature_2m?: number | null;
  readonly relative_humidity_2m?: number | null;
  readonly surface_pressure?: number | null;
  readonly wind_speed_10m?: number | null;
}

/** Raw Open-Meteo Weather Forecast response payload. */
export interface RawWeatherResponse {
  readonly latitude: number;
  readonly longitude: number;
  readonly current?: RawWeatherCurrent;
  readonly hourly: RawWeatherHourly;
}

/** Atmospheric mixing factors impacting pollutant dispersion. */
export interface WeatherFactors {
  readonly temperature: number;
  readonly humidity: number;
  readonly windSpeed: number;
  readonly surfacePressure: number;
  readonly stagnationRisk: 'low' | 'moderate' | 'high' | 'severe';
  readonly isInversion: boolean;
  readonly summary: string;
}

/** Hourly weather trajectory point. */
export interface HourlyWeatherPoint {
  readonly time: string;
  readonly temperature: number;
  readonly humidity: number;
  readonly windSpeed: number;
  readonly surfacePressure: number;
}

/** Transformed weather forecast dataset. */
export interface ForecastData {
  readonly latitude: number;
  readonly longitude: number;
  readonly current: WeatherFactors;
  readonly hourly: readonly HourlyWeatherPoint[];
  readonly fetchedAt: string;
}

/** Raw individual location record from Open-Meteo Geocoding API. */
export interface RawGeocodingResult {
  readonly id: number;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly country?: string;
  readonly admin1?: string;
  readonly country_code?: string;
}

/** Raw Open-Meteo Geocoding API response payload. */
export interface RawGeocodingResponse {
  readonly results?: readonly RawGeocodingResult[];
  readonly generationtime_ms?: number;
}

/** Normalized geocoding location with 2-decimal rounded coordinates. */
export interface GeocodingLocation {
  readonly id: number;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly country?: string;
  readonly admin1?: string;
  readonly displayName: string;
}
