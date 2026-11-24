// Upstream Gemini API client with fallback models and structured validation.
import { GEMINI_MODELS, API_TIMEOUTS } from '../src/constants/index.js';
import { AppError } from '../src/utils/error.js';
import {
  indoorTipsOutputSchema,
  chatOutputSchema,
  narratePlanOutputSchema,
  explainImpactOutputSchema,
  communityMessageOutputSchema,
} from '../shared/schemas.js';
import type { AiRequest, Provenance, AllowedTask } from '../shared/types.js';
import { resolveTaskFallback } from './fallback.js';
import { logServerError } from './logger.js';

interface RawCandidate {
  content?: { parts?: Array<{ text?: string }> };
}

/**
 * Validates task result using the respective task schema.
 *
 * @param task - Allowed task name.
 * @param data - Parsed candidate object.
 * @returns Validated data or throws validation error.
 */
function validateTaskOutput(task: AllowedTask, data: unknown): unknown {
  if (task === 'indoor-tips') return indoorTipsOutputSchema.parse(data);
  if (task === 'chat') return chatOutputSchema.parse(data);
  if (task === 'narrate-plan') return narratePlanOutputSchema.parse(data);
  if (task === 'explain-impact') return explainImpactOutputSchema.parse(data);
  return communityMessageOutputSchema.parse(data);
}

/**
 * Parses JSON output from raw text, stripping markdown code blocks.
 *
 * @param raw - Raw string from model output.
 * @returns Parsed JSON object.
 */
export function extractJsonPayload(raw: string): unknown {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Calls Gemini REST endpoint for a single model attempt.
 *
 * @param model - Model identifier.
 * @param apiKey - Gemini API key.
 * @param req - Request payload.
 * @param signal - Combined abort signal.
 * @returns Response object.
 */
async function callModel(
  model: string,
  apiKey: string,
  req: AiRequest,
  signal: AbortSignal
): Promise<Response> {
  const base = process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com';
  const url = `${base}/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const prompt = `Task: ${req.task}. Context: ${JSON.stringify(req.context)}. User: ${req.userText ?? ''}. Return valid JSON matching schema.`;

  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    signal,
  });
}

/**
 * Calls primary model and switches to fallback on 404 or 429.
 *
 * @param key - Gemini API key.
 * @param req - Request payload.
 * @param signal - Abort signal.
 * @returns Active response and model name.
 */
async function fetchWithFallback(
  key: string,
  req: AiRequest,
  signal: AbortSignal
): Promise<{ res: Response; model: string }> {
  const primary = process.env.GEMINI_MODEL ?? GEMINI_MODELS.PRIMARY;
  const fallback = process.env.GEMINI_FALLBACK_MODEL ?? GEMINI_MODELS.FALLBACK;
  let res = await callModel(primary, key, req, signal);
  let model = primary;
  if (res.status === 404 || res.status === 429) {
    res = await callModel(fallback, key, req, signal);
    model = fallback;
  }
  return { res, model };
}

/**
 * Parses and validates candidate parts from raw upstream response.
 *
 * @param res - Upstream fetch Response.
 * @param task - Allowed task name.
 * @returns Validated task output.
 */
async function parseCandidates(res: Response, task: AllowedTask): Promise<unknown> {
  if (!res.ok) throw new Error(`Upstream status ${res.status}`);
  const body = (await res.json()) as { candidates?: RawCandidate[] };
  const rawText = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response candidates');
  const parsed = extractJsonPayload(rawText);
  return validateTaskOutput(task, parsed);
}

/**
 * Executes an AI task against Gemini with model fallback and rule resilience.
 *
 * @param request - Validated AI request payload.
 * @param parentSignal - Optional caller abort signal.
 * @returns Validated task output and provenance.
 */
export async function executeAiTask(
  request: AiRequest,
  parentSignal?: AbortSignal
): Promise<{ result: unknown; provenance: Provenance }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AppError('AI service not configured', 503);

  const start = Date.now();
  const timeoutSignal = AbortSignal.timeout(API_TIMEOUTS.UPSTREAM_TIMEOUT_MS);
  const signal = parentSignal ? AbortSignal.any([parentSignal, timeoutSignal]) : timeoutSignal;

  try {
    const { res, model } = await fetchWithFallback(apiKey, request, signal);
    const result = await parseCandidates(res, request.task);
    return {
      result,
      provenance: { source: 'gemini', model, cached: false, latencyMs: Date.now() - start },
    };
  } catch (err) {
    if (signal.aborted) throw new AppError('Upstream timeout', 504);
    logServerError('gemini_call_failed', { task: request.task, errorName: (err as Error).name });
    const fallback = resolveTaskFallback(request.task, request.context.aqi, request.context.city);
    return {
      result: fallback,
      provenance: { source: 'rules', model: 'rules-v1', cached: false, latencyMs: Date.now() - start },
    };
  }
}
