// Unit tests for domain-backed rule fallbacks and retryable fallback execution.
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  getFallbackIndoorTips,
  getFallbackChat,
  resolveTaskFallback,
  executeWithFallback,
} from './fallback.js';

describe('Fallback Generators', () => {
  it('generates high urgency indoor tips for severe AQI', () => {
    const high = getFallbackIndoorTips(350);
    expect(high.urgency).toBe('high');
    expect(high.tips.length).toBeGreaterThanOrEqual(2);

    const moderate = getFallbackIndoorTips(100);
    expect(moderate.urgency).toBe('medium');
  });

  it('generates chat responses with suggested actions', () => {
    const chat = getFallbackChat('Delhi');
    expect(chat.reply).toContain('Delhi');
    expect(chat.suggestedActions?.length).toBe(3);
  });

  it('resolves all task fallback outputs correctly', () => {
    expect(resolveTaskFallback('indoor-tips', 300, 'Delhi')).toHaveProperty('tips');
    expect(resolveTaskFallback('chat', 200, 'Delhi')).toHaveProperty('reply');
    expect(resolveTaskFallback('narrate-plan', 150, 'Delhi')).toHaveProperty('narrative');
    expect(resolveTaskFallback('explain-impact', 250, 'Delhi', { aqi: 250, city: 'Delhi', facts: ['PM2.5 is 180'] })).toHaveProperty('healthAdvice');
    expect(resolveTaskFallback('explain-impact', 120, 'Delhi')).toHaveProperty('healthAdvice');
    expect(resolveTaskFallback('community-message', 250, 'Delhi')).toHaveProperty('urgency', 'high');
    expect(resolveTaskFallback('community-message', 100, 'Delhi')).toHaveProperty('urgency', 'medium');
  });

  it('settles on rules provenance after consecutive retry failures', async () => {
    const res = await executeWithFallback({ failCount: 3, task: 'indoor-tips', aqi: 310, city: 'Delhi' });
    expect(res.provenance.source).toBe('rules');
    expect(res.provenance.model).toBe('rules-v1');
    expect(res.result).toHaveProperty('tips');
  });

  it('returns custom attempt result when attemptFn succeeds on retry', async () => {
    const res = await executeWithFallback({
      maxAttempts: 2,
      attemptFn: async (attempt) => {
        if (attempt === 1) throw new Error('transient');
        return {
          result: { reply: 'Recovered' },
          provenance: { source: 'gemini', model: 'gemini-2.5-flash', cached: false, latencyMs: 12 },
        };
      },
    });
    expect(res.provenance.source).toBe('gemini');
    expect(res.result).toEqual({ reply: 'Recovered' });
  });

  it('returns rules fallback immediately when failCount is zero without attemptFn', async () => {
    const res = await executeWithFallback({ failCount: 0 });
    expect(res.provenance.source).toBe('rules');
  });
});
