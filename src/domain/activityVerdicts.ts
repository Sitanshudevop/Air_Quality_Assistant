// Domain engine evaluating Go / Wait / Avoid verdicts across daily lifestyle activities.
import type { VulnerabilityGroup } from './types.js';
import type { HourlyAirQualityPoint } from '../services/openMeteo.types.js';
import { evaluateAllActivityVerdicts, findSafeHour } from './activityVerdictRules.js';
import type { ActivityVerdictItem } from './activityVerdicts.types.js';

export type {
  ActivityId,
  ActivityVerdict,
  ActivityVerdictItem,
} from './activityVerdicts.types.js';

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
