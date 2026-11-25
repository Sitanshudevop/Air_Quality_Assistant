// Serverless AI proxy endpoint handling safety triage, bounded payload, caching, and rate limiting.
import { createHash } from 'node:crypto';
import {
  API_TIMEOUTS,
  MAX_PAYLOAD_BYTES,
  ERROR_MESSAGES,
} from '../src/constants/index.js';
import { AppError, getErrorMessage, getErrorStatusCode } from '../src/utils/error.js';
import { aiRequestSchema } from '../shared/schemas.js';
import type { AiRequest, AiResponse } from '../shared/types.js';
import { defaultAiCache } from '../server/cache.js';
import { defaultRateLimiter } from '../server/rate-limit.js';
import { executeAiTask } from '../server/gemini.js';
import { triageSafety, buildSafetyTaskResult } from '../server/safety.js';
import { logServerInfo, logServerError } from '../server/logger.js';

/** Creates standard JSON response with no-store caching headers. */
function jsonResponse(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

/** Derives client identifier from request headers. */
function getClientId(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

/** Sorts object keys deterministically for canonical cache key hashing. */
function sortRecord(record?: Record<string, unknown>): Record<string, unknown> {
  if (!record) return {};
  return Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((key) => [key, record[key]])
  );
}

/** Builds a normalized SHA-256 cache key covering task, context, pollutants, preferences, and userText. */
function buildCacheKey(req: AiRequest): string {
  const canonical = {
    task: req.task,
    city: req.context.city.trim().toLowerCase(),
    aqi: req.context.aqi,
    facts: req.context.facts.map((f) => f.trim()).sort(),
    pollutants: sortRecord(req.context.pollutants),
    userPreferences: sortRecord(req.context.userPreferences),
    userText: (req.userText ?? '').trim().toLowerCase(),
  };
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

/** Reads request body with a strict byte cap even when Content-Length header is absent. */
async function readBoundedBody(request: Request, maxBytes: number): Promise<unknown> {
  const rawBytes = request.body
    ? await readStreamWithLimit(request.body.getReader(), maxBytes)
    : Buffer.from(await request.text(), 'utf8');

  if (rawBytes.byteLength > maxBytes) {
    throw new AppError(ERROR_MESSAGES.PAYLOAD_TOO_LARGE, 413);
  }
  try {
    return JSON.parse(rawBytes.toString('utf8'));
  } catch {
    throw new AppError('Invalid request payload', 400);
  }
}

/** Reads a ReadableStream up to maxBytes, aborting early if exceeded. */
async function readStreamWithLimit(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  maxBytes: number
): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new AppError(ERROR_MESSAGES.PAYLOAD_TOO_LARGE, 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

/**
 * Named GET handler rejecting non-POST calls with 405 Method Not Allowed.
 *
 * @returns HTTP 405 JSON Response.
 */
export async function GET(): Promise<Response> {
  return jsonResponse({ error: ERROR_MESSAGES.METHOD_NOT_ALLOWED }, 405, { Allow: 'POST' });
}

/** Processes safety triage, cache lookup, and upstream AI execution. */
async function processAiRequest(req: AiRequest, signal: AbortSignal): Promise<AiResponse> {
  const triage = triageSafety(req.userText);
  const cacheKey = buildCacheKey(req);
  const cached = defaultAiCache.get(cacheKey) as AiResponse | null;
  if (cached) {
    return { ...cached, provenance: { ...cached.provenance, cached: true } };
  }

  if (triage.isBlocked) {
    const safeResponse: AiResponse = {
      task: req.task,
      result: buildSafetyTaskResult(req.task, triage, req.context),
      provenance: { source: 'rules', model: 'rules-v1', cached: false, latencyMs: 0 },
    };
    defaultAiCache.set(cacheKey, safeResponse);
    return safeResponse;
  }

  const { result, provenance, cacheable } = await executeAiTask(req, signal);
  const response: AiResponse = { task: req.task, result, provenance };
  if (provenance.source === 'gemini' || cacheable === true) {
    defaultAiCache.set(cacheKey, response);
  }
  return response;
}

/**
 * Named POST handler for AI proxy requests.
 *
 * @param request - Incoming HTTP request.
 * @returns Standard HTTP Response.
 */
export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return jsonResponse({ error: ERROR_MESSAGES.PAYLOAD_TOO_LARGE }, 413);
  }
  const rate = defaultRateLimiter.check(getClientId(request));
  if (!rate.allowed) {
    return jsonResponse({ error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED }, 429);
  }
  try {
    const rawBody = await readBoundedBody(request, MAX_PAYLOAD_BYTES);
    const parsed = aiRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonResponse({ error: 'Invalid request payload' }, 400);
    }
    const deadlineSignal = AbortSignal.timeout(API_TIMEOUTS.OVERALL_DEADLINE_MS);
    const data = await processAiRequest(parsed.data, deadlineSignal);
    logServerInfo('ai_request_success', { task: data.task, model: data.provenance.model });
    return jsonResponse(data, 200);
  } catch (error) {
    const status = getErrorStatusCode(error, 500);
    const safeError = status === 500 ? 'Internal server error' : getErrorMessage(error);
    logServerError('ai_request_error', { status, errorName: error instanceof Error ? error.name : 'Unknown' });
    return jsonResponse({ error: safeError }, status);
  }
}
