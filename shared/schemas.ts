// Shared Zod schemas and validation rules for client and server.
import { z } from 'zod';

/** Allowed AI task names. */
export const AllowedTasks = [
  'narrate-plan',
  'explain-impact',
  'chat',
  'indoor-tips',
  'community-message',
] as const;

/** Zod schema for allowed task type. */
export const taskSchema = z.enum(AllowedTasks);

/** Context provided to AI tasks. */
export const contextSchema = z.object({
  aqi: z.number().int().min(0).max(1000),
  city: z.string().min(1).max(100),
  facts: z.array(z.string().max(300)).max(20).default([]),
  pollutants: z.record(z.string(), z.number()).optional(),
  userPreferences: z.record(z.string(), z.unknown()).optional(),
});

/** Request schema for AI proxy requests. */
export const aiRequestSchema = z.object({
  task: taskSchema,
  context: contextSchema,
  userText: z.string().max(1000).optional(),
});

/** Provenance metadata attached to all AI outputs. */
export const provenanceSchema = z.object({
  source: z.enum(['gemini', 'rules']),
  model: z.string().min(1),
  cached: z.boolean(),
  latencyMs: z.number().nonnegative().optional(),
});

/** Output schema for indoor-tips task. */
export const indoorTipsOutputSchema = z.object({
  tips: z.array(z.string().min(1)).min(1).max(10),
  urgency: z.enum(['low', 'medium', 'high']),
});

/** Output schema for chat task. */
export const chatOutputSchema = z.object({
  reply: z.string().min(1),
  suggestedActions: z.array(z.string().min(1)).max(5).optional(),
});

/** Output schema for narrate-plan task. */
export const narratePlanOutputSchema = z.object({
  narrative: z.string().min(1),
  recommendations: z.array(z.string().min(1)).max(5),
});

/** Output schema for explain-impact task. */
export const explainImpactOutputSchema = z.object({
  explanation: z.string().min(1),
  healthAdvice: z.string().min(1),
});

/** Output schema for community-message task. */
export const communityMessageOutputSchema = z.object({
  message: z.string().min(1),
  urgency: z.enum(['low', 'medium', 'high']),
});

/** Generic AI proxy successful response schema. */
export const aiResponseSchema = z.object({
  task: taskSchema,
  result: z.unknown(),
  provenance: provenanceSchema,
});
