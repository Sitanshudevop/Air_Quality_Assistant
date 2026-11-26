// Domain engine computing honest cleaner hours counters derived from hourly series.
import type { HourlyAirQualityPoint } from '../services/openMeteo.types.js';

/** Structured outcome of cleaner hours evaluation. */
export interface CleanerHoursResult {
  readonly cleanHoursCount: number;
  readonly totalHours: number;
  readonly targetThreshold: number;
  readonly percentage: number;
  readonly summary: string;
}

/**
 * Computes how many hours in the hourly series were below a specified clean AQI threshold.
 *
 * @param points - Hourly air quality forecast or observed series.
 * @param targetThreshold - Upper AQI bound defining clean ambient air (defaults to 100).
 * @returns CleanerHoursResult with count and plain-language summary.
 */
export function computeCleanerHours(
  points: readonly HourlyAirQualityPoint[],
  targetThreshold = 100
): CleanerHoursResult {
  if (points.length === 0) {
    return {
      cleanHoursCount: 0,
      totalHours: 0,
      targetThreshold,
      percentage: 0,
      summary: `No hourly forecast data available to compute cleaner air hours.`,
    };
  }

  const sample = points.slice(0, 24);
  const totalHours = sample.length;
  let cleanHoursCount = 0;

  for (const pt of sample) {
    if (typeof pt.aqi === 'number' && Number.isFinite(pt.aqi) && pt.aqi <= targetThreshold) {
      cleanHoursCount += 1;
    }
  }

  const percentage = Math.round((cleanHoursCount / totalHours) * 100);
  const summary = `${cleanHoursCount} of the ${totalHours} evaluated hours are below ${targetThreshold} AQI (${percentage}% cleaner window).`;

  return {
    cleanHoursCount,
    totalHours,
    targetThreshold,
    percentage,
    summary,
  };
}
