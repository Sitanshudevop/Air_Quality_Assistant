// Client-side AI proxy service with 12s timeout and offline rule-based fallback.
import { API_TIMEOUTS } from '../constants/index.js';
import { getAqiCategory } from '../domain/aqi.js';
import { buildSmartChatFallback } from '../domain/chatFallback.js';
import { getIndoorRecommendations, getVentilationRecommendation } from '../domain/indoor.js';
import { generateRoutine } from '../domain/routine.js';
import { aiResponseSchema } from '../../shared/schemas.js';
import type { AiResponse, AiStatusResponse, AllowedTask, TaskContext } from '../../shared/types.js';
import { setAiCallStatus } from './aiStatus.js';

/** Input options for requesting an AI-assisted task response. */
export interface GetAiResponseInput {
  readonly task: AllowedTask;
  readonly context?: TaskContext;
  readonly userText?: string;
  readonly isOffline?: boolean;
  readonly signal?: AbortSignal;
}

const DEFAULT_CONTEXT: TaskContext = { aqi: 150, city: 'Delhi', facts: [] };

/** Resolves deterministic task result object using pure domain modules. */
function buildClientFallbackResult(task: AllowedTask, context: TaskContext, userText?: string): unknown {
  const category = getAqiCategory(context.aqi);
  const vent = getVentilationRecommendation(context.aqi);

  if (task === 'indoor-tips') {
    const recs = getIndoorRecommendations({ roomType: 'living', roomAreaSqFt: 180, ceilingHeightFt: 9, currentOutdoorAqi: context.aqi });
    return { tips: [vent.advice, ...recs.actions.map((a) => `${a.title}: ${a.detail}`)].slice(0, 4), urgency: context.aqi > 200 ? 'high' : 'medium' };
  }
  if (task === 'narrate-plan') {
    const items = generateRoutine(category);
    return {
      narrative: `Daily plan for ${context.city} (${category}, AQI ${context.aqi}).`,
      recommendations: items.slice(0, 4).map((i) => i.action),
    };
  }
  if (task === 'explain-impact') {
    return {
      explanation: `${category} air quality (AQI ${context.aqi}) in ${context.city} elevates particulate inhalation outdoors.`,
      healthAdvice: vent.advice,
    };
  }
  if (task === 'community-message') {
    return {
      message: `${context.city} Air Quality Alert: ${category} (AQI ${context.aqi}). Reduce outdoor exertion.`,
      urgency: context.aqi > 200 ? 'high' : 'medium',
    };
  }
  return buildSmartChatFallback({ city: context.city, aqi: context.aqi, userText, facts: context.facts });
}

/** Generates deterministic client-side rule fallback envelope. */
function buildClientFallback(opts: {
  task: AllowedTask;
  context: TaskContext;
  startMs: number;
  userText?: string;
  reason?: string;
}): AiResponse {
  if (opts.reason) console.warn('[Saans AI] Falling back to rule-based mode:', opts.reason);
  return {
    task: opts.task,
    result: buildClientFallbackResult(opts.task, opts.context, opts.userText),
    provenance: { source: 'rules', model: 'rules-v1', cached: false, latencyMs: Date.now() - opts.startMs, reason: opts.reason },
  };
}

/** Creates an AbortController wired to CLIENT_TIMEOUT_MS and optional caller signal. */
function createTimeoutController(callerSignal?: AbortSignal): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUTS.CLIENT_TIMEOUT_MS);
  const onAbort = (): void => controller.abort();
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener('abort', onAbort);
  }
  return {
    controller,
    cleanup: () => {
      clearTimeout(timer);
      if (callerSignal) callerSignal.removeEventListener('abort', onAbort);
    },
  };
}

/**
 * Checks whether the serverless AI proxy reports a configured Gemini API key.
 *
 * @param signal - Optional cancellation AbortSignal.
 * @returns Configuration status object.
 */
export async function checkAiStatus(signal?: AbortSignal): Promise<AiStatusResponse> {
  const { controller, cleanup } = createTimeoutController(signal);
  try {
    const res = await fetch('/api/ai-status', { signal: controller.signal });
    if (!res.ok) {
      setAiCallStatus('rules');
      return { configured: false };
    }
    const data = (await res.json()) as Partial<AiStatusResponse>;
    const isReady = data.configured === true;
    setAiCallStatus(isReady ? 'live' : 'rules');
    return { configured: isReady };
  } catch {
    setAiCallStatus('rules');
    return { configured: false };
  } finally {
    cleanup();
  }
}

function describeProxyStatus(status: number): string {
  if (status === 504 || status === 408) return 'Live AI timed out — click Retry to try again';
  if (status === 429) return 'Live AI is busy (rate limit) — try Retry shortly';
  if (status === 400) return 'Request format rejected — try a shorter message';
  return `Live AI temporarily unavailable (HTTP ${status})`;
}

function describeProxyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : 'Network error';
  const isAbort = (err instanceof Error && err.name === 'AbortError') || /abort/i.test(raw);
  return isAbort ? 'Live AI timed out — click Retry to try again' : raw;
}

async function requestProxyAi(input: GetAiResponseInput, context: TaskContext, start: number): Promise<AiResponse> {
  const { controller, cleanup } = createTimeoutController(input.signal);
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: input.task, context, userText: input.userText }),
      signal: controller.signal,
    });
    if (!res.ok) {
      setAiCallStatus('rules');
      return buildClientFallback({ task: input.task, context, startMs: start, userText: input.userText, reason: describeProxyStatus(res.status) });
    }
    const parsed = aiResponseSchema.safeParse(await res.json());
    if (!parsed.success) {
      setAiCallStatus('rules');
      return buildClientFallback({ task: input.task, context, startMs: start, userText: input.userText, reason: 'Invalid AI response' });
    }
    const isGemini = parsed.data.provenance.source === 'gemini';
    setAiCallStatus(isGemini ? 'live' : 'rules');
    if (!isGemini && parsed.data.provenance.reason) console.warn('[Saans AI] Server fallback:', parsed.data.provenance.reason);
    return parsed.data;
  } catch (err) {
    setAiCallStatus('rules');
    return buildClientFallback({ task: input.task, context, startMs: start, userText: input.userText, reason: describeProxyError(err) });
  } finally {
    cleanup();
  }
}

/**
 * Requests an AI-assisted response from the serverless proxy with a 12s timeout and rule fallback.
 *
 * @param input - Task identifier, optional air-quality context, user prompt, and offline flag.
 * @returns Validated AI response with provenance metadata.
 */
export async function getAiResponse(input: GetAiResponseInput): Promise<AiResponse> {
  const start = Date.now();
  const context = input.context ?? DEFAULT_CONTEXT;
  const offline = input.isOffline === true || (typeof navigator !== 'undefined' && navigator.onLine === false);
  if (offline) {
    setAiCallStatus('rules');
    return buildClientFallback({ task: input.task, context, startMs: start, userText: input.userText, reason: 'Browser is offline' });
  }
  return requestProxyAi(input, context, start);
}
