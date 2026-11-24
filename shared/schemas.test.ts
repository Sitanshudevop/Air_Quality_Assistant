// Unit tests for shared validation schemas.
import { describe, it, expect } from 'vitest';
import { isApiErrorResponse } from './types.js';
import {
  taskSchema,
  contextSchema,
  aiRequestSchema,
  indoorTipsOutputSchema,
  chatOutputSchema,
  narratePlanOutputSchema,
  explainImpactOutputSchema,
  communityMessageOutputSchema,
  aiResponseSchema,
} from './schemas.js';

describe('Shared Schemas', () => {
  it('validates allowed task names', () => {
    expect(taskSchema.parse('indoor-tips')).toBe('indoor-tips');
    expect(() => taskSchema.parse('invalid-task')).toThrow();
  });

  it('validates context constraints', () => {
    const valid = { aqi: 250, city: 'Delhi', facts: ['Smog alert'] };
    expect(contextSchema.parse(valid).city).toBe('Delhi');

    expect(() => contextSchema.parse({ aqi: -10, city: 'Delhi' })).toThrow();
    expect(() => contextSchema.parse({ aqi: 200, city: '' })).toThrow();
  });

  it('validates AI request shapes', () => {
    const valid = {
      task: 'indoor-tips',
      context: { aqi: 150, city: 'Noida' },
      userText: 'Hello',
    };
    expect(aiRequestSchema.parse(valid).task).toBe('indoor-tips');
    expect(() => aiRequestSchema.parse({ task: 'indoor-tips' })).toThrow();
  });

  it('validates specific task outputs', () => {
    expect(
      indoorTipsOutputSchema.parse({ tips: ['Keep sealed'], urgency: 'high' }).urgency
    ).toBe('high');
    expect(chatOutputSchema.parse({ reply: 'Hello' }).reply).toBe('Hello');
    expect(
      narratePlanOutputSchema.parse({ narrative: 'Plan', recommendations: ['Rec'] })
        .narrative
    ).toBe('Plan');
    expect(
      explainImpactOutputSchema.parse({
        explanation: 'Exp',
        healthAdvice: 'Adv',
      }).explanation
    ).toBe('Exp');
    expect(
      communityMessageOutputSchema.parse({ message: 'Msg', urgency: 'low' }).message
    ).toBe('Msg');
  });

  it('validates full AI response structure', () => {
    const res = {
      task: 'indoor-tips',
      result: { tips: ['Tip 1'], urgency: 'high' },
      provenance: { source: 'gemini', model: 'gemini-2.5-flash', cached: false },
    };
    expect(aiResponseSchema.parse(res).task).toBe('indoor-tips');
  });

  it('validates ApiErrorResponse type guard', () => {
    expect(isApiErrorResponse({ error: 'Boom' })).toBe(true);
    expect(isApiErrorResponse({ other: 123 })).toBe(false);
    expect(isApiErrorResponse(null)).toBe(false);
    expect(isApiErrorResponse('string')).toBe(false);
  });
});
