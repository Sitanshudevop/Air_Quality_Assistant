// Unit tests for chatContext WeakMap memoization and grounded context building.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchChatReply } from './chatContext.js';
import * as aiService from '../../services/ai.js';

describe('chatContext memoization', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reuses WeakMap-cached pollutant and window facts across repeated calls', async () => {
    const spy = vi.spyOn(aiService, 'getAiResponse').mockResolvedValue({
      task: 'chat',
      result: { reply: 'Stay indoors.', followUpQuestions: [] },
      provenance: { source: 'rules', model: 'rules-v1', cached: false, latencyMs: 0 },
    });

    const pollutants = { pm2_5: 180, pm10: 250 };
    const hourlyPoints = [
      { time: '2026-11-27T06:00', aqi: 300, category: 'Very Poor' as const, pm2_5: 180, pm10: 250, no2: 40, isEstimate: false },
      { time: '2026-11-27T14:00', aqi: 120, category: 'Moderate' as const, pm2_5: 70, pm10: 100, no2: 20, isEstimate: false },
    ];
    const controller = new AbortController();

    await fetchChatReply({
      aqi: 300,
      category: 'Very Poor',
      cityName: 'Delhi',
      userText: 'First turn',
      signal: controller.signal,
      pollutants,
      hourlyPoints,
      vulnerability: 'elderly',
    });

    await fetchChatReply({
      aqi: 300,
      category: 'Very Poor',
      cityName: 'Delhi',
      userText: 'Second turn',
      signal: controller.signal,
      pollutants,
      hourlyPoints,
    });

    expect(spy).toHaveBeenCalledTimes(2);
    const secondFacts = spy.mock.calls[1]?.[0]?.context?.facts ?? [];
    expect(secondFacts.some((f) => f.includes('PM2.5: 180'))).toBe(true);
    expect(secondFacts.some((f) => f.includes('Best ventilation'))).toBe(true);
    expect(secondFacts.some((f) => f.includes('Commute guidance:'))).toBe(true);
    expect(secondFacts.some((f) => f.includes('Commute PM2.5 impact') && f.includes('Metro with N95 cuts inhaled dose by'))).toBe(true);
    expect(secondFacts.some((f) => f.includes('Ventilation guidance now:'))).toBe(true);
  });
});
