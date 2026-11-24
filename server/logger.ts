// Server-side sanitized logging utility ensuring zero key or prompt leakage.

/** Metadata allowed in server operational logs. */
export interface ServerLogMeta {
  status?: number;
  model?: string;
  durationMs?: number;
  task?: string;
  cached?: boolean;
  reason?: string;
  errorName?: string;
}

/**
 * Sanitizes metadata to ensure sensitive values are stripped.
 *
 * @param meta - Input metadata object.
 * @returns Sanitized metadata safe for output.
 */
function sanitizeMeta(meta?: ServerLogMeta): Record<string, unknown> {
  if (!meta) {
    return {};
  }
  const clean: Record<string, unknown> = {};
  if (meta.status !== undefined) clean.status = meta.status;
  if (meta.model !== undefined) clean.model = meta.model;
  if (meta.durationMs !== undefined) clean.durationMs = meta.durationMs;
  if (meta.task !== undefined) clean.task = meta.task;
  if (meta.cached !== undefined) clean.cached = meta.cached;
  if (meta.reason !== undefined) clean.reason = meta.reason;
  if (meta.errorName !== undefined) clean.errorName = meta.errorName;
  return clean;
}

/**
 * Logs informational server events without sensitive payloads.
 *
 * @param action - Action identifier (e.g. 'ai_request_success').
 * @param meta - Operational metadata.
 */
export function logServerInfo(action: string, meta?: ServerLogMeta): void {
  console.info(JSON.stringify({ level: 'info', action, ...sanitizeMeta(meta) }));
}

/**
 * Logs warning server events without sensitive payloads.
 *
 * @param action - Action identifier.
 * @param meta - Operational metadata.
 */
export function logServerWarn(action: string, meta?: ServerLogMeta): void {
  console.warn(JSON.stringify({ level: 'warn', action, ...sanitizeMeta(meta) }));
}

/**
 * Logs server error events without sensitive payloads.
 *
 * @param action - Action identifier.
 * @param meta - Operational metadata.
 */
export function logServerError(action: string, meta?: ServerLogMeta): void {
  console.error(JSON.stringify({ level: 'error', action, ...sanitizeMeta(meta) }));
}
