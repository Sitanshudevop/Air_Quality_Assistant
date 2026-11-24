// Curated, frozen demo snapshots for North Indian winter smog scenarios.
import { deepFreeze, generateDiurnalHourly } from './generator.js';
import type { DemoSnapshot, DemoCityId } from './types.js';

const delhiCurves = generateDiurnalHourly(380, 16, 82, 0.8);
const lucknowCurves = generateDiurnalHourly(110, 18, 75, 1.4);
const mumbaiCurves = generateDiurnalHourly(48, 28, 68, 3.8);
const bengaluruCurves = generateDiurnalHourly(18, 22, 55, 4.2);

/** Curated frozen snapshots for representative Indian metropolitan air basins. */
export const DEMO_SNAPSHOTS: Readonly<Record<DemoCityId, DemoSnapshot>> = deepFreeze({
  delhi: {
    cityId: 'delhi',
    cityName: 'Delhi',
    aqi: 425,
    category: 'Severe',
    dominantPollutant: 'PM2.5',
    pollutants: { pm2_5: 380, pm10: 510, no2: 85, so2: 24, co: 2.4, o3: 35 },
    weather: { temperature: 16, humidity: 82, windSpeed: 0.8, pressure: 1016 },
    hourlyAirQuality: delhiCurves.hourlyAq,
    hourlyWeather: delhiCurves.hourlyWeather,
    hourly: {
      time: delhiCurves.hourlyAq.map((p) => p.time),
      pm2_5: delhiCurves.hourlyAq.map((p) => p.pm2_5),
      pm10: delhiCurves.hourlyAq.map((p) => p.pm10 ?? 0),
    },
    isEstimate: true,
    source: 'curated frozen demo snapshot',
  },
  lucknow: {
    cityId: 'lucknow',
    cityName: 'Lucknow',
    aqi: 260,
    category: 'Poor',
    dominantPollutant: 'PM2.5',
    pollutants: { pm2_5: 110, pm10: 190, no2: 52, so2: 18, co: 1.6, o3: 42 },
    weather: { temperature: 18, humidity: 75, windSpeed: 1.4, pressure: 1015 },
    hourlyAirQuality: lucknowCurves.hourlyAq,
    hourlyWeather: lucknowCurves.hourlyWeather,
    hourly: {
      time: lucknowCurves.hourlyAq.map((p) => p.time),
      pm2_5: lucknowCurves.hourlyAq.map((p) => p.pm2_5),
      pm10: lucknowCurves.hourlyAq.map((p) => p.pm10 ?? 0),
    },
    isEstimate: true,
    source: 'curated frozen demo snapshot',
  },
  mumbai: {
    cityId: 'mumbai',
    cityName: 'Mumbai',
    aqi: 135,
    category: 'Moderate',
    dominantPollutant: 'PM2.5',
    pollutants: { pm2_5: 48, pm10: 95, no2: 38, so2: 12, co: 0.9, o3: 28 },
    weather: { temperature: 28, humidity: 68, windSpeed: 3.8, pressure: 1012 },
    hourlyAirQuality: mumbaiCurves.hourlyAq,
    hourlyWeather: mumbaiCurves.hourlyWeather,
    hourly: {
      time: mumbaiCurves.hourlyAq.map((p) => p.time),
      pm2_5: mumbaiCurves.hourlyAq.map((p) => p.pm2_5),
      pm10: mumbaiCurves.hourlyAq.map((p) => p.pm10 ?? 0),
    },
    isEstimate: true,
    source: 'curated frozen demo snapshot',
  },
  bengaluru: {
    cityId: 'bengaluru',
    cityName: 'Bengaluru',
    aqi: 45,
    category: 'Good',
    dominantPollutant: 'PM2.5',
    pollutants: { pm2_5: 18, pm10: 38, no2: 22, so2: 8, co: 0.5, o3: 22 },
    weather: { temperature: 22, humidity: 55, windSpeed: 4.2, pressure: 1014 },
    hourlyAirQuality: bengaluruCurves.hourlyAq,
    hourlyWeather: bengaluruCurves.hourlyWeather,
    hourly: {
      time: bengaluruCurves.hourlyAq.map((p) => p.time),
      pm2_5: bengaluruCurves.hourlyAq.map((p) => p.pm2_5),
      pm10: bengaluruCurves.hourlyAq.map((p) => p.pm10 ?? 0),
    },
    isEstimate: true,
    source: 'curated frozen demo snapshot',
  },
});

/**
 * Retrieves a curated demo snapshot for a city with fallback to Delhi.
 *
 * @param cityId - Identifier of the city.
 * @returns Frozen DemoSnapshot.
 */
export function getSnapshot(cityId: string): DemoSnapshot {
  const normalized = cityId.toLowerCase().trim() as DemoCityId;
  return DEMO_SNAPSHOTS[normalized] ?? DEMO_SNAPSHOTS.delhi;
}
