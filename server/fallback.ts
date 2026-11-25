// Domain-backed deterministic rule fallbacks for air quality AI tasks.
import { getAqiCategory } from '../src/domain/aqi.js';
import { generateRoutine } from '../src/domain/routine.js';
import { getIndoorRecommendations, getVentilationRecommendation } from '../src/domain/indoor.js';
import type {
  AllowedTask,
  IndoorTipsResult,
  ChatResult,
  NarratePlanResult,
  ExplainImpactResult,
  CommunityMessageResult,
  Provenance,
  TaskContext,
} from '../shared/types.js';

/** Union of all deterministic fallback task outputs. */
export type TaskFallbackResult =
  | IndoorTipsResult
  | ChatResult
  | NarratePlanResult
  | ExplainImpactResult
  | CommunityMessageResult;

/** Options for retryable fallback execution. */
export interface ExecuteWithFallbackOptions {
  readonly failCount?: number;
  readonly maxAttempts?: number;
  readonly task?: AllowedTask;
  readonly aqi?: number;
  readonly city?: string;
  readonly context?: TaskContext;
  readonly attemptFn?: (attempt: number) => Promise<{ result: unknown; provenance: Provenance }>;
}

/**
 * Returns domain-powered deterministic indoor protection tips.
 *
 * @param aqi - Air Quality Index number.
 * @returns Structured indoor tips result.
 */
export function getFallbackIndoorTips(aqi: number): IndoorTipsResult {
  const recs = getIndoorRecommendations({
    roomType: 'living',
    roomAreaSqFt: 180,
    ceilingHeightFt: 9,
    currentOutdoorAqi: aqi,
  });
  const tips = [recs.ventilation.advice, ...recs.actions.map((a) => `${a.title}: ${a.detail}`)];
  return {
    tips: tips.slice(0, 4),
    urgency: aqi > 200 ? 'high' : 'medium',
  };
}

/**
 * Returns deterministic fallback data for conversational chat.
 *
 * @param city - City name.
 * @param aqi - Optional AQI reading for tailored guidance.
 * @returns Structured chat result.
 */
export function getFallbackChat(city: string, aqi = 150): ChatResult {
  const category = getAqiCategory(aqi);
  const vent = getVentilationRecommendation(aqi);
  return {
    reply: `Air quality in ${city} is ${category} (estimated AQI ${aqi}). ${vent.advice}`,
    suggestedActions: ['Check hourly forecast', 'View indoor air tips', 'Review N95 mask advice'],
  };
}

/**
 * Resolves domain-driven rule fallback result for any supported task.
 *
 * @param task - Allowed task name.
 * @param aqi - Air Quality Index value.
 * @param city - Target city name.
 * @param context - Optional full task context.
 * @returns Structured task fallback output.
 */
export function resolveTaskFallback(
  task: AllowedTask,
  aqi: number,
  city: string,
  context?: TaskContext
): TaskFallbackResult {
  const category = getAqiCategory(aqi);
  if (task === 'indoor-tips') return getFallbackIndoorTips(aqi);
  if (task === 'chat') return getFallbackChat(city, aqi);

  if (task === 'narrate-plan') {
    const routine = generateRoutine(category);
    const recommendations = routine.slice(0, 4).map((item) => item.action);
    return {
      narrative: `Daily protection plan for ${city} at ${category} air quality (AQI ${aqi}).`,
      recommendations,
    };
  }

  if (task === 'explain-impact') {
    const factsHint = context?.facts?.[0] ? ` Key fact: ${context.facts[0]}.` : '';
    return {
      explanation: `Current ${category} AQI of ${aqi} in ${city} increases inhaled particulate exposure outdoors.${factsHint}`,
      healthAdvice: aqi > 200
        ? 'Use a well-fitted N95 respirator outdoors and shift exercise indoors.'
        : 'Prefer midday windows when dispersion improves and limit high-traffic routes.',
    };
  }

  return {
    message: `Air quality update for ${city}: ${category} (AQI ${aqi}). Limit strenuous outdoor activity and keep vulnerable groups indoors.`,
    urgency: aqi > 200 ? 'high' : 'medium',
  };
}

/** Executes one attempt or throws simulated failure. */
async function runFallbackAttempt(
  attempt: number,
  options: ExecuteWithFallbackOptions,
  fallbackPayload: TaskFallbackResult,
  start: number
): Promise<{ result: unknown; provenance: Provenance }> {
  if (options.attemptFn) return await options.attemptFn(attempt);
  if (attempt <= (options.failCount ?? 0)) throw new Error('Simulated upstream failure');
  return {
    result: fallbackPayload,
    provenance: { source: 'rules', model: 'rules-v1', cached: false, latencyMs: Date.now() - start },
  };
}

/** Normalizes retry defaults for executeWithFallback. */
function normalizeFallbackOptions(options: ExecuteWithFallbackOptions): {
  maxAttempts: number;
  fallbackPayload: TaskFallbackResult;
} {
  const task = options.task ?? 'chat';
  const aqi = options.aqi ?? options.context?.aqi ?? 150;
  const city = options.city ?? options.context?.city ?? 'Delhi';
  return {
    maxAttempts: options.maxAttempts ?? 2,
    fallbackPayload: resolveTaskFallback(task, aqi, city, options.context),
  };
}

/**
 * Executes an async AI attempt with bounded retries and settles on domain rule fallback on failure.
 *
 * @param options - Retry configuration and fallback context.
 * @returns Task result paired with provenance metadata.
 */
export async function executeWithFallback(
  options: ExecuteWithFallbackOptions
): Promise<{ result: unknown; provenance: Provenance }> {
  const start = Date.now();
  const { maxAttempts, fallbackPayload } = normalizeFallbackOptions(options);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await runFallbackAttempt(attempt, options, fallbackPayload, start);
    } catch {
      // Continue to retry or settle on rules fallback
    }
  }

  return {
    result: fallbackPayload,
    provenance: { source: 'rules', model: 'rules-v1', cached: false, latencyMs: Date.now() - start },
  };
}
