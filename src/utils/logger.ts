// Sanitized client-side logging utility.

/** Log entry payload without PII or sensitive keys. */
export interface ClientLogData {
  action: string;
  status?: string | number;
  durationMs?: number;
  error?: string;
}

/**
 * Sanitizes and logs informational messages to console.
 *
 * @param message - Descriptive log message.
 * @param data - Optional structured metadata.
 */
export function logInfo(message: string, data?: ClientLogData): void {
  if (data !== undefined) {
    console.info(`[Saans Info] ${message}`, data);
    return;
  }
  console.info(`[Saans Info] ${message}`);
}

/**
 * Sanitizes and logs error messages to console.
 *
 * @param message - Descriptive error context.
 * @param data - Optional structured metadata.
 */
export function logError(message: string, data?: ClientLogData): void {
  if (data !== undefined) {
    console.error(`[Saans Error] ${message}`, data);
    return;
  }
  console.error(`[Saans Error] ${message}`);
}
