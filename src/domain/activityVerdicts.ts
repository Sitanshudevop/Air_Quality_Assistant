// Domain engine evaluating Go / Wait / Avoid verdicts across daily lifestyle activities.
import type { VulnerabilityGroup } from './types.js';
import type { HourlyAirQualityPoint } from '../services/openMeteo.types.js';
import { evaluateAllActivityVerdicts, findSafeHour } from './activityVerdictRules.js';

export type ActivityId =
  | 'morning_walk'
  | 'kids_playground'
  | 'jogging_exercise'
  | 'school_run'
  | 'opening_windows'
  | 'drying_laundry'
  | 'two_wheeler_commute';

export type ActivityVerdict = 'Go' | 'Wait' | 'Avoid';

/** Activity verdict item with actionable safety recommendation. */
export interface ActivityVerdictItem {
  readonly id: ActivityId;
  readonly title: string;
  readonly verdict: ActivityVerdict;
  readonly safeWindow?: string;
  readonly reason: string;
  readonly maskRecommendation?: string;
}

/**
 * Evaluates Go / Wait / Avoid verdicts for 7 core lifestyle activities.
 *
 * @param aqi - Active AQI value.
 * @param vulnerability - Household biological vulnerability group.
 * @param hourlyPoints - Optional hourly forecast series to identify cleaner alternative windows.
 * @returns Array of 7 evaluated activity verdicts.
 */
export function evaluateActivityVerdicts(
  aqi: number,
  vulnerability: VulnerabilityGroup = 'healthy_adult',
  hourlyPoints?: readonly HourlyAirQualityPoint[]
): readonly ActivityVerdictItem[] {
  const isVuln = vulnerability !== 'healthy_adult';
  const safeWin = findSafeHour(hourlyPoints);

  return evaluateAllActivityVerdicts(aqi, isVuln, safeWin);
}
