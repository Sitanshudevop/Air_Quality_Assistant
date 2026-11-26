// Domain chaos and boundary resilience tests for 0, -1, NaN, ±Infinity, 1e9, and legacy aliases.
import { describe, it, expect } from 'vitest';
import { calculateAqi, calculateSubIndex, getAqiCategory } from './aqi.js';
import { calculateRelativeDose } from './exposure.js';
import { compareAlternatives } from './alternatives.js';
import { calculateCadrRequirement, getIndoorRecommendations, getVentilationRecommendation } from './indoor.js';
import type { AlternativeChoice } from './types.js';

const CHAOS_NUMBERS = [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1e9] as const;

describe('Domain Numeric Chaos Resilience', () => {
  it.each(CHAOS_NUMBERS)('handles chaos input %s safely in aqi calculations', (val) => {
    const sub25 = calculateSubIndex(val, 'PM2.5');
    const sub10 = calculateSubIndex(val, 'PM10');
    const cat = getAqiCategory(val);
    const aqiRes = calculateAqi(val, val);

    expect(Number.isFinite(sub25)).toBe(true);
    expect(Number.isFinite(sub10)).toBe(true);
    expect(sub25).toBeGreaterThanOrEqual(0);
    expect(sub25).toBeLessThanOrEqual(500);
    expect(Number.isFinite(aqiRes.aqi)).toBe(true);
    expect(cat).toBeTruthy();

    if (val === 1e9) {
      expect(sub25).toBe(500);
      expect(cat).toBe('Severe');
    } else if (!Number.isFinite(val) || val <= 0) {
      expect(sub25).toBe(0);
      expect(cat).toBe('Good');
    }
  });

  it.each(CHAOS_NUMBERS)('handles chaos input %s safely in exposure calculations', (val) => {
    const res = calculateRelativeDose({
      pm25: val,
      durationMinutes: val,
      activity: 'moderate',
      microenvironment: 'outdoors',
      maskType: 'n95',
      vulnerability: 'healthy_adult',
    });

    expect(Number.isFinite(res.relativeDoseUg)).toBe(true);
    expect(Number.isFinite(res.baselineDoseUg)).toBe(true);
    expect(Number.isFinite(res.percentageChange)).toBe(true);
    expect(Number.isFinite(res.uncertaintyRangeUg[0])).toBe(true);
    expect(Number.isFinite(res.uncertaintyRangeUg[1])).toBe(true);
    expect(res.relativeDoseUg).toBeGreaterThanOrEqual(0);
  });

  it('resolves legacy exposure aliases for environment, activityLevel, and vulnerabilityGroup', () => {
    const indoorAsthmatic = calculateRelativeDose({
      pm25: 150,
      durationMinutes: 30,
      activityLevel: 'vigorous',
      environment: 'indoor',
      maskType: 'surgical',
      vulnerabilityGroup: 'asthmatic',
    });
    const transitGeneral = calculateRelativeDose({
      pm25: 150,
      durationMinutes: 30,
      environment: 'transit',
      maskType: 'none',
      vulnerabilityGroup: 'general',
    });
    const outdoorDefault = calculateRelativeDose({
      pm25: 150,
      durationMinutes: 30,
      environment: 'outdoor',
      maskType: 'cloth',
    });

    expect(indoorAsthmatic.relativeDoseUg).toBeGreaterThan(0);
    expect(transitGeneral.relativeDoseUg).toBeGreaterThan(0);
    expect(outdoorDefault.relativeDoseUg).toBeGreaterThan(0);
  });

  it.each(CHAOS_NUMBERS)('handles chaos input %s safely in compareAlternatives including walk mode', (val) => {
    const baseline: AlternativeChoice = { id: 'b', title: 'Walk', mode: 'walk', maskType: 'none', distanceKm: val };
    const option: AlternativeChoice = {
      id: 'o',
      title: 'Metro',
      mode: 'metro',
      maskType: 'n95',
      distanceKm: val,
      durationMinutes: val,
    };

    const results = compareAlternatives(baseline, [option], val, 'child');
    expect(results).toHaveLength(1);
    expect(Number.isFinite(results[0].inhaledDoseUg)).toBe(true);
    expect(Number.isFinite(results[0].relativeDoseChangePct)).toBe(true);
    expect(Number.isFinite(results[0].co2eGrams)).toBe(true);
    expect(Number.isFinite(results[0].doseUncertaintyRangeUg[0])).toBe(true);
    expect(Number.isFinite(results[0].doseUncertaintyRangeUg[1])).toBe(true);
  });

  it('supports explicit durationMinutes and unknown mode/vulnerability fallbacks in alternatives', () => {
    const base: AlternativeChoice = { id: 'b', title: 'Base', mode: 'car_petrol', maskType: 'none', distanceKm: 10, durationMinutes: 45 };
    const opt: AlternativeChoice = { id: 'o', title: 'Walk', mode: 'walk', maskType: 'cloth', distanceKm: 2, durationMinutes: 25 };
    const res = compareAlternatives(base, [opt], 120);
    expect(res[0].inhaledDoseUg).toBeGreaterThan(0);
  });

  it.each(CHAOS_NUMBERS)('handles chaos input %s safely in indoor CADR and ventilation', (val) => {
    const cadr = calculateCadrRequirement(val, val, val);
    const vent = getVentilationRecommendation(val);
    const full = getIndoorRecommendations({
      roomType: 'office',
      roomAreaSqFt: val,
      ceilingHeightFt: val,
      currentOutdoorAqi: val,
    });

    expect(Number.isFinite(cadr)).toBe(true);
    expect(cadr).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(vent.durationMinutes)).toBe(true);
    expect(Number.isFinite(full.cadrRequiredM3Hr)).toBe(true);
  });
});
