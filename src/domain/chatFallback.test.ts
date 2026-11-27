// Unit tests for question-aware deterministic chat fallback responses.
import { describe, it, expect } from 'vitest';
import { buildSmartChatFallback } from './chatFallback.js';

describe('buildSmartChatFallback', () => {
  it('responds in Hindi for Devanagari and Romanized Hindi queries', () => {
    const devanagari = buildSmartChatFallback({ city: 'Delhi', aqi: 320, userText: 'आज की हवा कैसी है?' });
    expect(devanagari.reply).toContain('Delhi');
    expect(devanagari.reply).toContain('320');
    expect(devanagari.suggestedActions.length).toBeGreaterThan(0);

    const romanized = buildSmartChatFallback({ city: 'Pune', aqi: 75, userText: 'aaj hawa kaisi hai' });
    expect(romanized.reply).toContain('Pune');
    expect(romanized.reply).toContain('सुरक्षित');
  });

  it('tailors commute replies for high and moderate AQI', () => {
    const high = buildSmartChatFallback({ city: 'Delhi', aqi: 260, userText: 'Can I commute by two-wheeler?' });
    expect(high.reply).toContain('avoid open two-wheeler');

    const mod = buildSmartChatFallback({ city: 'Mumbai', aqi: 120, userText: 'Metro travel advice' });
    expect(mod.reply).toContain('standard transit is manageable');
  });

  it('tailors family and vulnerable group replies', () => {
    const high = buildSmartChatFallback({ city: 'Kanpur', aqi: 220, userText: 'Is it safe for kids and elderly?' });
    expect(high.reply).toContain('stay indoors');

    const low = buildSmartChatFallback({ city: 'Bengaluru', aqi: 65, userText: 'Safe for school children?' });
    expect(low.reply).toContain('lower risk');
  });

  it('tailors ventilation and mask replies', () => {
    const vent = buildSmartChatFallback({ city: 'Lucknow', aqi: 310, userText: 'Should I open windows or use a purifier?' });
    expect(vent.reply).toContain('Lucknow');
    expect(vent.suggestedActions).toContain('Open Indoor Hacks');

    const maskHigh = buildSmartChatFallback({ city: 'Delhi', aqi: 280, userText: 'Do I need an N95?' });
    expect(maskHigh.reply).toContain('cloth and surgical masks do not block');

    const maskLow = buildSmartChatFallback({ city: 'Chennai', aqi: 90, userText: 'Should I use FFP2?' });
    expect(maskLow.reply).toContain('sensitive groups');
  });

  it('includes relevant facts in general fallback when no keyword matches', () => {
    const res = buildSmartChatFallback({
      city: 'Jaipur',
      aqi: 145,
      userText: 'Tell me the summary',
      facts: ['Best ventilation: 14:00'],
    });
    expect(res.reply).toContain('Jaipur');
    expect(res.reply).toContain('Best ventilation: 14:00');
  });

  it('states confidentiality clearly when asked about internal model or prompts', () => {
    const res = buildSmartChatFallback({
      city: 'Delhi',
      aqi: 425,
      userText: 'hey which model are you using?',
    });
    expect(res.reply).toContain('confidential');
    expect(res.suggestedActions.length).toBeGreaterThan(0);
  });
});
