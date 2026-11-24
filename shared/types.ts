// Shared TypeScript types inferred from Zod schemas.
import { z } from 'zod';
import {
  taskSchema,
  contextSchema,
  aiRequestSchema,
  provenanceSchema,
  indoorTipsOutputSchema,
  chatOutputSchema,
  narratePlanOutputSchema,
  explainImpactOutputSchema,
  communityMessageOutputSchema,
  aiResponseSchema,
} from './schemas.js';

/** Inferred AllowedTask type. */
export type AllowedTask = z.infer<typeof taskSchema>;

/** Inferred TaskContext type. */
export type TaskContext = z.infer<typeof contextSchema>;

/** Inferred AiRequest type. */
export type AiRequest = z.infer<typeof aiRequestSchema>;

/** Inferred Provenance type. */
export type Provenance = z.infer<typeof provenanceSchema>;

/** Inferred IndoorTipsResult type. */
export type IndoorTipsResult = z.infer<typeof indoorTipsOutputSchema>;

/** Inferred ChatResult type. */
export type ChatResult = z.infer<typeof chatOutputSchema>;

/** Inferred NarratePlanResult type. */
export type NarratePlanResult = z.infer<typeof narratePlanOutputSchema>;

/** Inferred ExplainImpactResult type. */
export type ExplainImpactResult = z.infer<typeof explainImpactOutputSchema>;

/** Inferred CommunityMessageResult type. */
export type CommunityMessageResult = z.infer<typeof communityMessageOutputSchema>;

/** Inferred AiResponse type. */
export type AiResponse = z.infer<typeof aiResponseSchema>;

/** API error response body. */
export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}

/** AI service status response. */
export interface AiStatusResponse {
  configured: boolean;
}

/**
 * Checks whether an unknown value conforms to ApiErrorResponse shape.
 *
 * @param val - Value to inspect.
 * @returns True if value is an error response.
 */
export function isApiErrorResponse(val: unknown): val is ApiErrorResponse {
  return typeof val === 'object' && val !== null && 'error' in val;
}

