// Unified error handling and extraction utilities.

/** Application-level custom error class. */
export class AppError extends Error {
  /** HTTP status code associated with error. */
  public readonly statusCode: number;

  /** Additional diagnostic details. */
  public readonly details: unknown;

  /**
   * Constructs an AppError instance.
   *
   * @param message - User-facing error message.
   * @param statusCode - HTTP status code (defaults to 500).
   * @param details - Optional error details.
   */
  public constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Extracts a human-readable message from an unknown error.
 *
 * @param error - Caught error of unknown type.
 * @returns Formatted error string.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

/**
 * Determines HTTP status code from an error or returns default.
 *
 * @param error - Error instance or unknown value.
 * @param defaultStatus - Fallback HTTP status code.
 * @returns Inferred or fallback HTTP status code.
 */
export function getErrorStatusCode(error: unknown, defaultStatus = 500): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return defaultStatus;
}
