// Unit tests for AIR_STANDARDS registry and activeConditions state resolvers.
import { describe, it, expect } from 'vitest';
import { AIR_STANDARDS } from './standards.js';
import { resolveActiveConditions, resolveEffectiveProfile } from '../state/activeConditions.js';

describe('AIR_STANDARDS & ActiveConditions', () => {
  it('exposes WHO 2021 and Indian NAAQS benchmark standards', () => {
    expect(AIR_STANDARDS.who.pm2_5).toBe(15);
    expect(AIR_STANDARDS.naaqs.pm2_5).toBe(60);
    expect(AIR_STANDARDS.citations.who).toContain('WHO');
  });

  it('resolves demo, manual, live, and awaiting-live states without demo substitution', () => {
    const demo = resolveActiveConditions({
      isDemo: true,
      demoCityId: 'delhi',
      liveData: null,
      liveForecast: null,
      manualData: null,
    });
    expect(demo.cityName).toBe('Delhi');

    const awaiting = resolveActiveConditions({
      isDemo: false,
      demoCityId: 'delhi',
      liveData: null,
      liveForecast: null,
      manualData: null,
    });
    expect(awaiting.status).toBe('empty');
    expect(awaiting.origin).toBe('live');
    expect(awaiting.aqi).toBeUndefined();

    const manual = resolveActiveConditions({
      isDemo: false,
      demoCityId: 'delhi',
      liveData: null,
      liveForecast: null,
      manualData: {
        aqi: 210,
        pm25: 93,
        category: 'Poor',
        source: 'user-entered reading',
        sourceLabel: 'user-entered reading',
        isEstimate: true,
        enteredAt: '2026-11-25T00:00:00Z',
        cityName: 'Noida',
      },
    });
    expect(manual.sourceLabel).toBe('user-entered reading');

    const personaProfile = resolveEffectiveProfile(true, 'commuter_couple');
    expect(personaProfile.commuteMode).toBe('two-wheeler');
  });
});
