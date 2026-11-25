// Upstream Gemini REST v1beta client with structured outputs, grounding retry, and rule fallback.
import { ZodError } from 'zod';
import { GEMINI_MODELS, API_TIMEOUTS } from '../src/constants/index.js';
import { AppError } from '../src/utils/error.js';
import {
  indoorTipsOutputSchema,
  chatOutputSchema,
  narratePlanOutputSchema,
  explainImpactOutputSchema,
  communityMessageOutputSchema,
} from '../shared/schemas.js';
import type { AiRequest, Provenance } from '../shared/types.js';
import { getTaskPromptConfig, buildUserPrompt } from './prompts.js';
import { verifyNumericGrounding, extractTextForGrounding } from './grounding.js';
import { triageSafety, buildSafetyTaskResult } from './safety.js';
import { resolveTaskFallback } from './fallback.js';
import { logServerError, logServerWarn } from './logger.js';

interface RawCandidate { content?: { parts?: Array<{ text?: string }> } }
interface GenerationOutcome { result: unknown; provenance: Provenance; cacheable?: boolean }

class GroundingError extends Error {
  public constructor() { super('Numeric grounding failed'); this.name = 'GroundingError'; }
}
class UpstreamStatusError extends Error {
  public readonly status: number;
  public constructor(s: number) { super(`Upstream status ${s}`); this.name = 'UpstreamStatusError'; this.status = s; }
}

const TASK_SCHEMAS = {
  'indoor-tips': indoorTipsOutputSchema,
  chat: chatOutputSchema,
  'narrate-plan': narratePlanOutputSchema,
  'explain-impact': explainImpactOutputSchema,
  'community-message': communityMessageOutputSchema,
} as const;

/**
 * Parses JSON output from raw text, stripping optional markdown code fences.
 *
 * @param raw - Raw string from model output.
 * @returns Parsed JSON value.
 */
export function extractJsonPayload(raw: string): unknown {
  return JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim());
}

/** Sends a structured generateContent request to Gemini REST v1beta. */
async function callModel(model: string, req: AiRequest, signal: AbortSignal, stricter: boolean): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY ?? '';
  const base = process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com';
  const { systemInstruction, responseSchema } = getTaskPromptConfig(req.task);
  return fetch(`${base}/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: buildUserPrompt(req, stricter) }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json', responseSchema },
    }),
    signal,
  });
}

/** Calls primary model and switches to secondary fallback model on 404 or 429. */
async function fetchWithFallback(req: AiRequest, signal: AbortSignal, stricter: boolean): Promise<{ res: Response; model: string }> {
  const primary = process.env.GEMINI_MODEL ?? GEMINI_MODELS.PRIMARY;
  const fallback = process.env.GEMINI_FALLBACK_MODEL ?? GEMINI_MODELS.FALLBACK;
  const first = await callModel(primary, req, signal, stricter);
  if (first.status === 404 || first.status === 429) {
    return { res: await callModel(fallback, req, signal, stricter), model: fallback };
  }
  return { res: first, model: primary };
}

/** Parses candidate output, validates Zod schema, and verifies numeric grounding. */
async function parseAndGround(res: Response, req: AiRequest): Promise<unknown> {
  if (!res.ok) throw new UpstreamStatusError(res.status);
  const body = (await res.json()) as { candidates?: RawCandidate[] };
  const rawText = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response candidates');

  const validated = TASK_SCHEMAS[req.task].parse(extractJsonPayload(rawText));
  const extraAllowedNumbers = [req.context.aqi, ...Object.values(req.context.pollutants ?? {})];
  const grounded = verifyNumericGrounding({
    text: extractTextForGrounding(validated),
    facts: req.context.facts,
    extraAllowedNumbers,
  });
  if (!grounded) throw new GroundingError();
  return validated;
}

/** Builds a rules-based fallback response with provenance. */
function buildRulesResponse(req: AiRequest, start: number, cacheable = false): GenerationOutcome {
  return {
    result: resolveTaskFallback(req.task, req.context.aqi, req.context.city, req.context),
    provenance: { source: 'rules', model: 'rules-v1', cached: false, latencyMs: Date.now() - start },
    cacheable,
  };
}

/** Evaluates caught generation errors for abort, retry eligibility, or non-transient status. */
function classifyError(err: unknown, signal: AbortSignal): { retryable: boolean; cacheableFallback: boolean } {
  if (signal.aborted) throw new AppError('Upstream timeout', 504);
  const retryable = err instanceof ZodError || err instanceof SyntaxError || err instanceof GroundingError;
  const cacheableFallback = err instanceof UpstreamStatusError && err.status >= 400 && err.status < 429;
  return { retryable, cacheableFallback };
}

/**
 * Generates a structured AI response with 1-retry on Zod or numeric grounding failure, settling on rules.
 *
 * @param req - Validated AI request payload.
 * @param signal - Abort signal for timeout control.
 * @returns Validated output, provenance metadata, and cacheability hint.
 */
export async function generateWithGrounding(req: AiRequest, signal: AbortSignal): Promise<GenerationOutcome> {
  const start = Date.now();
  const triage = triageSafety(req.userText);
  if (triage.isBlocked) {
    return {
      result: buildSafetyTaskResult(req.task, triage, req.context),
      provenance: { source: 'rules', model: 'rules-v1', cached: false, latencyMs: 0 },
      cacheable: true,
    };
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { res, model } = await fetchWithFallback(req, signal, attempt === 1);
      return {
        result: await parseAndGround(res, req),
        provenance: { source: 'gemini', model, cached: false, latencyMs: Date.now() - start },
        cacheable: true,
      };
    } catch (err) {
      const { retryable, cacheableFallback } = classifyError(err, signal);
      if (retryable && attempt === 0) {
        logServerWarn('gemini_retry_triggered', { task: req.task, errorName: (err as Error).name });
        continue;
      }
      logServerError('gemini_call_failed', { task: req.task, errorName: (err as Error).name });
      return buildRulesResponse(req, start, cacheableFallback);
    }
  }
  return buildRulesResponse(req, start, false);
}

/**
 * Executes an AI task against Gemini with key checks, timeout signal, grounding, and rule fallback.
 *
 * @param request - Validated AI request payload.
 * @param parentSignal - Optional caller abort signal.
 * @returns Validated task output, provenance, and cacheability hint.
 */
export async function executeAiTask(request: AiRequest, parentSignal?: AbortSignal): Promise<GenerationOutcome> {
  if (!process.env.GEMINI_API_KEY) throw new AppError('AI service not configured', 503);
  const timeoutSignal = AbortSignal.timeout(API_TIMEOUTS.UPSTREAM_TIMEOUT_MS);
  const signal = parentSignal ? AbortSignal.any([parentSignal, timeoutSignal]) : timeoutSignal;
  return generateWithGrounding(request, signal);
}
