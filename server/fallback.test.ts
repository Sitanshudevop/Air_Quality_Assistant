// Unit tests for rule-based air quality fallback generators.
import { describe, it, expect } from 'vitest';
import {
  getFallbackIndoorTips,
  getFallbackChat,
  resolveTaskFallback,
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
    expect(resolveTaskFallback('explain-impact', 180, 'Delhi')).toHaveProperty('healthAdvice');
    expect(resolveTaskFallback('community-message', 250, 'Delhi')).toHaveProperty('message');
    expect(resolveTaskFallback('community-message', 100, 'Delhi')).toHaveProperty('urgency', 'medium');
  });
});
