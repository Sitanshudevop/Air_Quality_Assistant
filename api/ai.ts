// Serverless AI proxy endpoint handling task execution, caching, and rate limiting.
import {
  API_TIMEOUTS,
  MAX_PAYLOAD_BYTES,
  ERROR_MESSAGES,
} from '../src/constants/index.js';
import { getErrorMessage, getErrorStatusCode } from '../src/utils/error.js';
import { aiRequestSchema } from '../shared/schemas.js';
import type { AiRequest, AiResponse } from '../shared/types.js';
import { defaultAiCache } from '../server/cache.js';
import { defaultRateLimiter } from '../server/rate-limit.js';
import { executeAiTask } from '../server/gemini.js';
import { logServerInfo, logServerError } from '../server/logger.js';

/**
 * Creates standard JSON response with no-store caching headers.
 *
 * @param data - Response body payload.
 * @param status - HTTP status code.
 * @param extraHeaders - Optional additional response headers.
 * @returns Standard Fetch API Response object.
 */
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

/**
 * Derives client identifier from request headers.
 *
 * @param request - HTTP request instance.
 * @returns Extracted client identifier string.
 */
function getClientId(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

/**
 * Named GET handler rejecting non-POST calls with 405 Method Not Allowed.
 *
 * @returns HTTP 405 JSON Response.
 */
export async function GET(): Promise<Response> {
  return jsonResponse({ error: ERROR_MESSAGES.METHOD_NOT_ALLOWED }, 405, { Allow: 'POST' });
}

/**
 * Processes validated request against cache or invokes upstream AI.
 *
 * @param req - Validated AI request payload.
 * @param signal - Deadline abort signal.
 * @returns AI response payload.
 */
async function processAiRequest(req: AiRequest, signal: AbortSignal): Promise<AiResponse> {
  const factsKey = (req.context.facts ?? []).slice().sort().join('|');
  const cacheKey = `${req.task}:${req.context.city}:${req.context.aqi}:${factsKey}:${req.userText ?? ''}`;
  const cached = defaultAiCache.get(cacheKey) as AiResponse | null;
  if (cached) {
    return { ...cached, provenance: { ...cached.provenance, cached: true } };
  }
  const { result, provenance } = await executeAiTask(req, signal);
  const response: AiResponse = { task: req.task, result, provenance };
  defaultAiCache.set(cacheKey, response);
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
    const rawBody = await request.json().catch(() => null);
    const parsed = aiRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonResponse({ error: ERROR_MESSAGES.INVALID_BODY, details: parsed.error.issues }, 400);
    }
    const deadlineSignal = AbortSignal.timeout(API_TIMEOUTS.OVERALL_DEADLINE_MS);
    const data = await processAiRequest(parsed.data, deadlineSignal);
    logServerInfo('ai_request_success', { task: data.task, model: data.provenance.model });
    return jsonResponse(data, 200);
  } catch (error) {
    const status = getErrorStatusCode(error, 500);
    logServerError('ai_request_error', { status, reason: getErrorMessage(error) });
    return jsonResponse({ error: getErrorMessage(error) }, status);
  }
}
