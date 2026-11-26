// Rule evaluation helpers for activity verdicts across outdoor and household routines.
import type { HourlyAirQualityPoint } from '../services/openMeteo.types.js';
import type { ActivityVerdictItem } from './activityVerdicts.js';

/**
 * Scans hourly forecast points to find a lower-pollution time window.
 *
 * @param points - Hourly forecast series.
 * @returns Formatted better window recommendation or undefined.
 */
export function findSafeHour(points?: readonly HourlyAirQualityPoint[]): string | undefined {
  if (!points || points.length === 0) return undefined;
  let best = points[0];
  for (const pt of points) {
    if (pt.aqi < best.aqi) best = pt;
  }
  if (best.aqi < 200) {
    const match = best.time.match(/T(\d{2}:\d{2})/);
    return `Better window: ${match ? match[1] : best.time} (Est. AQI ${Math.round(best.aqi)})`;
  }
  return undefined;
}

function getWalkVerdict(aqi: number, isVuln: boolean, safeWin?: string): ActivityVerdictItem {
  if (aqi > 300 || (aqi > 200 && isVuln)) {
    return {
      id: 'morning_walk', title: 'Morning Walk', verdict: 'Avoid', safeWindow: safeWin,
      reason: 'Ground-level thermal inversion traps cold particulate smog; outdoor walking increases intake.',
      maskRecommendation: 'N95 respirator required if outdoors',
    };
  }
  if (aqi > 150) {
    return {
      id: 'morning_walk', title: 'Morning Walk', verdict: 'Wait', safeWindow: safeWin,
      reason: 'High morning stagnation. Defer walking until afternoon solar heating lifts inversion.',
      maskRecommendation: 'Wear N95 respirator',
    };
  }
  return { id: 'morning_walk', title: 'Morning Walk', verdict: 'Go', reason: 'Air quality is within acceptable bounds for gentle outdoor walking.' };
}

function getPlaygroundVerdict(aqi: number, safeWin?: string): ActivityVerdictItem {
  if (aqi > 200) {
    return {
      id: 'kids_playground', title: "Kids' Playground", verdict: 'Avoid', safeWindow: safeWin,
      reason: "Children's elevated breathing rates lead to deep alveolar deposition. Shift to indoor play.",
      maskRecommendation: 'Child-sized certified N95 / KF94',
    };
  }
  if (aqi > 100) {
    return {
      id: 'kids_playground', title: "Kids' Playground", verdict: 'Wait', safeWindow: safeWin,
      reason: 'Moderate air pollution; limit intense cardio games and monitor for coughing.',
    };
  }
  return { id: 'kids_playground', title: "Kids' Playground", verdict: 'Go', reason: 'Air quality allows normal outdoor playground activities.' };
}

function getExerciseVerdict(aqi: number, safeWin?: string): ActivityVerdictItem {
  if (aqi > 200) {
    return {
      id: 'jogging_exercise', title: 'Jogging / Exercise', verdict: 'Avoid', safeWindow: safeWin,
      reason: 'Strenuous cardio bypasses nasal filtration and pulls fine particulates deep into lungs.',
      maskRecommendation: 'Shift workouts indoors near air purifier',
    };
  }
  if (aqi > 100) {
    return {
      id: 'jogging_exercise', title: 'Jogging / Exercise', verdict: 'Wait', safeWindow: safeWin,
      reason: 'Exercise during afternoon hours when surface atmospheric dispersion is at its peak.',
    };
  }
  return { id: 'jogging_exercise', title: 'Jogging / Exercise', verdict: 'Go', reason: 'Favorable ambient conditions for outdoor cardio training.' };
}

function getSchoolRunVerdict(aqi: number, isVuln: boolean): ActivityVerdictItem {
  if (aqi > 300) {
    return {
      id: 'school_run', title: 'School Run', verdict: 'Wait',
      reason: 'Extreme particulate levels during morning rush hour. Pre-seal masks before leaving.',
      maskRecommendation: 'Certified N95 respirator mandatory',
    };
  }
  return {
    id: 'school_run', title: 'School Run', verdict: 'Go',
    reason: 'Standard transit safe; vulnerable children should keep windows closed in transit.',
    maskRecommendation: isVuln || aqi > 150 ? 'Wear N95 mask' : undefined,
  };
}

function getVentilationVerdict(aqi: number, safeWin?: string): ActivityVerdictItem {
  if (aqi > 250) {
    return {
      id: 'opening_windows', title: 'Opening Windows', verdict: 'Avoid', safeWindow: safeWin,
      reason: 'Outdoor air will rapidly infiltrate and pollute indoor air. Keep doors sealed.',
    };
  }
  if (aqi > 120) {
    return {
      id: 'opening_windows', title: 'Opening Windows', verdict: 'Wait', safeWindow: safeWin,
      reason: 'Limit window opening to brief 10-15 minute cross-ventilation during peak afternoon warmth.',
    };
  }
  return { id: 'opening_windows', title: 'Opening Windows', verdict: 'Go', reason: 'Good ambient conditions for natural home ventilation.' };
}

function getLaundryVerdict(aqi: number): ActivityVerdictItem {
  if (aqi > 200) {
    return {
      id: 'drying_laundry', title: 'Drying Laundry Outside', verdict: 'Avoid',
      reason: 'Airborne soot adheres to damp fabrics. Dry indoors near a ceiling fan.',
    };
  }
  if (aqi > 100) {
    return { id: 'drying_laundry', title: 'Drying Laundry Outside', verdict: 'Wait', reason: 'Hang outdoors only during midday sunlight.' };
  }
  return { id: 'drying_laundry', title: 'Drying Laundry Outside', verdict: 'Go', reason: 'Clean outdoor air is suitable for clothes drying.' };
}

function getTwoWheelerVerdict(aqi: number, safeWin?: string): ActivityVerdictItem {
  if (aqi > 300) {
    return {
      id: 'two_wheeler_commute', title: 'Two-Wheeler Commute', verdict: 'Avoid', safeWindow: safeWin,
      reason: 'Direct exposure to unburned exhaust. Use Metro rail or closed-window AC cab.',
      maskRecommendation: 'Fitted N95 respirator mandatory',
    };
  }
  if (aqi > 150) {
    return {
      id: 'two_wheeler_commute', title: 'Two-Wheeler Commute', verdict: 'Wait', safeWindow: safeWin,
      reason: 'Shift commute timing outside heavy rush hour (08:00-10:00).',
      maskRecommendation: 'Wear N95 respirator',
    };
  }
  return { id: 'two_wheeler_commute', title: 'Two-Wheeler Commute', verdict: 'Go', reason: 'Acceptable for scooter or motorcycle travel.' };
}

/**
 * Evaluates all 7 lifestyle activity verdict items based on environmental parameters.
 *
 * @param aqi - Active AQI value.
 * @param isVuln - True when household includes biologically vulnerable demographics.
 * @param safeWin - Optional safer hourly window string.
 * @returns Array of 7 evaluated activity verdicts.
 */
export function evaluateAllActivityVerdicts(
  aqi: number,
  isVuln: boolean,
  safeWin?: string
): readonly ActivityVerdictItem[] {
  return [
    getWalkVerdict(aqi, isVuln, safeWin),
    getPlaygroundVerdict(aqi, safeWin),
    getExerciseVerdict(aqi, safeWin),
    getSchoolRunVerdict(aqi, isVuln),
    getVentilationVerdict(aqi, safeWin),
    getLaundryVerdict(aqi),
    getTwoWheelerVerdict(aqi, safeWin),
  ];
}
