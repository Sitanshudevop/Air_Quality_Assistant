// Deterministic rule-based fallbacks for air quality tasks.
import type {
  AllowedTask,
  IndoorTipsResult,
  ChatResult,
  NarratePlanResult,
  ExplainImpactResult,
  CommunityMessageResult,
} from '../shared/types.js';

/**
 * Returns deterministic fallback data for indoor protection tips.
 *
 * @param aqi - Air Quality Index number.
 * @returns Structured indoor tips result.
 */
export function getFallbackIndoorTips(aqi: number): IndoorTipsResult {
  const isSevere = aqi > 200;
  return {
    tips: isSevere
      ? [
          'Keep windows and doors sealed between 6 AM and 10 AM during temperature inversion.',
          'Run HEPA air purifiers in sealed bedrooms; avoid burning incense or candles.',
          'Damp-mop floors instead of brooming to prevent re-suspending settled PM2.5.',
        ]
      : [
          'Aerate rooms during midday (12 PM - 3 PM) when atmospheric mixing disperses surface smog.',
          'Wipe window sills and door frames with damp cloths to capture particulate matter.',
        ],
    urgency: isSevere ? 'high' : 'medium',
  };
}

/**
 * Returns deterministic fallback data for conversational chat.
 *
 * @param city - City name.
 * @returns Structured chat result.
 */
export function getFallbackChat(city: string): ChatResult {
  return {
    reply: `Air quality in ${city} requires proactive precautions. Limit outdoor exercise during morning smog hours.`,
    suggestedActions: ['Check hourly forecast', 'View indoor air tips', 'Review N95 mask advice'],
  };
}

/**
 * Resolves rule-based fallback result for any supported task.
 *
 * @param task - Allowed task name.
 * @param aqi - Air Quality Index value.
 * @param city - Target city name.
 * @returns Generic task fallback output.
 */
export function resolveTaskFallback(
  task: AllowedTask,
  aqi: number,
  city: string
): IndoorTipsResult | ChatResult | NarratePlanResult | ExplainImpactResult | CommunityMessageResult {
  if (task === 'indoor-tips') {
    return getFallbackIndoorTips(aqi);
  }
  if (task === 'chat') {
    return getFallbackChat(city);
  }
  if (task === 'narrate-plan') {
    return {
      narrative: `Daily action plan for ${city} at AQI ${aqi}.`,
      recommendations: ['Stay indoors during morning peak', 'Run air purifier'],
    };
  }
  if (task === 'explain-impact') {
    return {
      explanation: `Current AQI of ${aqi} in ${city} poses significant respiratory risks.`,
      healthAdvice: 'Use an N95 respirator if stepping outdoors.',
    };
  }
  return {
    message: `Air alert for ${city}: AQI ${aqi}. Please limit outdoor activities.`,
    urgency: aqi > 200 ? 'high' : 'medium',
  };
}
