// Unit tests for multi-modal transport and sustainable alternative choices.
import { describe, expect, it } from 'vitest';
import { compareAlternatives } from './alternatives.js';
import type { AlternativeChoice } from './types.js';

describe('Alternatives Comparison Domain Module', () => {
  const baseline: AlternativeChoice = {
    id: 'base-auto',
    title: 'Auto-Rickshaw (No Mask)',
    mode: 'auto_rickshaw',
    maskType: 'none',
    distanceKm: 10,
  };

  const options: AlternativeChoice[] = [
    {
      id: 'opt-auto-n95',
      title: 'Auto-Rickshaw + N95',
      mode: 'auto_rickshaw',
      maskType: 'n95',
      distanceKm: 10,
    },
    {
      id: 'opt-metro',
      title: 'Metro Rail',
      mode: 'metro',
      maskType: 'none',
      distanceKm: 10,
    },
    {
      id: 'opt-metro-n95',
      title: 'Metro Rail + N95',
      mode: 'metro',
      maskType: 'n95',
      distanceKm: 10,
    },
    {
      id: 'opt-car',
      title: 'Private Petrol Car',
      mode: 'car_petrol',
      maskType: 'none',
      distanceKm: 10,
    },
    {
      id: 'opt-bus-diesel',
      title: 'Diesel City Bus',
      mode: 'bus_diesel',
      maskType: 'none',
      distanceKm: 10,
    },
    {
      id: 'opt-bus-ev',
      title: 'Electric Bus',
      mode: 'bus_ev',
      maskType: 'none',
      distanceKm: 10,
    },
    {
      id: 'opt-bike-petrol',
      title: 'Petrol 2-Wheeler',
      mode: 'two_wheeler_petrol',
      maskType: 'none',
      distanceKm: 10,
    },
    {
      id: 'opt-bike-ev',
      title: 'Electric 2-Wheeler',
      mode: 'two_wheeler_ev',
      maskType: 'none',
      distanceKm: 10,
    },
    {
      id: 'opt-walk',
      title: 'Walk',
      mode: 'walk',
      maskType: 'none',
      distanceKm: 2,
    },
  ];

  it('compares multi-modal transport options against baseline correctly', () => {
    const results = compareAlternatives(baseline, options, 250);
    expect(results).toHaveLength(9);

    const autoN95 = results.find((r) => r.choiceId === 'opt-auto-n95');
    expect(autoN95?.relativeDoseChangePct).toBe(-95);
    expect(autoN95?.co2eDeltaGrams).toBe(0);
    expect(autoN95?.summary).toContain('Reduces personal inhaled PM2.5 dose by 95%');

    const metro = results.find((r) => r.choiceId === 'opt-metro');
    expect(metro?.relativeDoseChangePct).toBeLessThan(-75);
    expect(metro?.co2eDeltaGrams).toBeLessThan(0);
    expect(metro?.summary).toContain('saves');

    const car = results.find((r) => r.choiceId === 'opt-car');
    expect(car?.relativeDoseChangePct).toBeLessThan(0);
    expect(car?.co2eDeltaGrams).toBeGreaterThan(0);
    expect(car?.summary).toContain('adds');

    results.forEach((res) => {
      expect(res.doseUncertaintyRangeUg[0]).toBeLessThanOrEqual(res.inhaledDoseUg);
      expect(res.inhaledDoseUg).toBeLessThanOrEqual(res.doseUncertaintyRangeUg[1]);
    });
  });

  it('handles zero distance trip without throwing and returns zero emissions', () => {
    const zeroBase: AlternativeChoice = { ...baseline, distanceKm: 0 };
    const zeroOption: AlternativeChoice = { ...options[0], distanceKm: 0 };

    const results = compareAlternatives(zeroBase, [zeroOption], 200);
    expect(results[0].inhaledDoseUg).toBe(0);
    expect(results[0].co2eGrams).toBe(0);
    expect(results[0].co2eDeltaGrams).toBe(0);
    expect(results[0].relativeDoseChangePct).toBe(0);
  });

  it('incorporates vulnerability group weighting in relative dose calculations', () => {
    const normalResults = compareAlternatives(baseline, [options[1]], 200, 'healthy_adult');
    const childResults = compareAlternatives(baseline, [options[1]], 200, 'child');

    expect(childResults[0].inhaledDoseUg).toBeGreaterThan(normalResults[0].inhaledDoseUg);
  });

  it('handles scenario where alternative increases personal inhaled dose and falls back to walk mode', () => {
    const carBaseline: AlternativeChoice = {
      id: 'base-car',
      title: 'Car Base',
      mode: 'car_petrol',
      maskType: 'none',
      distanceKm: 10,
    };
    const walkChoice: AlternativeChoice = {
      id: 'walk-choice',
      title: 'Walk Choice',
      mode: 'unknown_mode' as unknown as AlternativeChoice['mode'],
      maskType: 'none',
      distanceKm: 10,
    };
    const results = compareAlternatives(carBaseline, [walkChoice], 200);
    expect(results[0].relativeDoseChangePct).toBeGreaterThan(0);
    expect(results[0].summary).toContain('Increases personal inhaled PM2.5 dose');
  });
});
