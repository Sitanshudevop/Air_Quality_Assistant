// Application constants for Saans.

/** Air quality category AQI bounds. */
export const AQI_THRESHOLDS = {
  GOOD_MAX: 50,
  MODERATE_MAX: 100,
  POOR_MAX: 200,
  SEVERE_MAX: 300,
} as const;

/** API execution deadline and timeout constants in milliseconds. */
export const API_TIMEOUTS = {
  UPSTREAM_TIMEOUT_MS: 8000,
  OVERALL_DEADLINE_MS: 9000,
  CLIENT_TIMEOUT_MS: 12000,
} as const;

/** In-memory cache limits. */
export const CACHE_CONFIG = {
  TTL_MS: 10 * 60 * 1000,
  MAX_ENTRIES: 100,
} as const;

/** Sliding-window rate limit parameters. */
export const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS_PER_WINDOW: 30,
  WINDOW_MS: 60 * 1000,
} as const;

/** Gemini model identifiers. */
export const GEMINI_MODELS = {
  PRIMARY: 'gemini-2.5-flash',
  FALLBACK: 'gemini-1.5-flash',
} as const;

/** Maximum allowed payload size in bytes (64 KB). */
export const MAX_PAYLOAD_BYTES = 64 * 1024;

/** Standard error messages returned by API. */
export const ERROR_MESSAGES = {
  METHOD_NOT_ALLOWED: 'Method not allowed',
  INVALID_BODY: 'Invalid request body',
  PAYLOAD_TOO_LARGE: 'Payload exceeds 64KB limit',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded, please retry later',
  SERVICE_UNAVAILABLE: 'AI service not configured',
  GATEWAY_TIMEOUT: 'Upstream timeout',
} as const;
