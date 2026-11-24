// Unit tests for relative inhaled dose calculations and uncertainty propagation.
import { describe, expect, it } from 'vitest';
import { calculateRelativeDose, EXPOSURE_DISCLAIMER } from './exposure.js';
import type { ActivityLevel, MaskType, MicroEnvironment, VulnerabilityGroup } from './types.js';

describe('Exposure Model Domain Module', () => {
  it('includes mandatory non-medical disclaimer and avoids clinical claims', () => {
    const res = calculateRelativeDose({
      pm25: 150,
      activity: 'light',
      durationMinutes: 30,
      microenvironment: 'outdoors',
      maskType: 'none',
    });
    expect(res.caveat).toBe(EXPOSURE_DISCLAIMER);
    expect(res.caveat).toContain('Not medical advice');
    expect(res.caveat).not.toContain('cancer');
    expect(res.caveat).not.toContain('mortality');
  });

  describe('Activity level dose scaling', () => {
    const activityCases: { activity: ActivityLevel; minExpectedDose: number }[] = [
      { activity: 'sleep', minExpectedDose: 10 },
      { activity: 'rest', minExpectedDose: 15 },
      { activity: 'light', minExpectedDose: 30 },
      { activity: 'moderate', minExpectedDose: 70 },
      { activity: 'heavy', minExpectedDose: 120 },
    ];

    it.each(activityCases)('scales dose monotonically with activity $activity', ({ activity, minExpectedDose }) => {
      const res = calculateRelativeDose({
        pm25: 100,
        activity,
        durationMinutes: 60,
        microenvironment: 'outdoors',
        maskType: 'none',
      });
      expect(res.relativeDoseUg).toBeGreaterThan(minExpectedDose);
    });
  });

  describe('Mask mitigation efficiency', () => {
    const maskCases: { mask: MaskType; maxExpectedRatio: number }[] = [
      { mask: 'none', maxExpectedRatio: 1.0 },
      { mask: 'cloth', maxExpectedRatio: 0.8 },
      { mask: 'surgical', maxExpectedRatio: 0.5 },
      { mask: 'n95', maxExpectedRatio: 0.1 },
    ];

    it.each(maskCases)('reduces relative dose with mask $mask', ({ mask, maxExpectedRatio }) => {
      const unmasked = calculateRelativeDose({
        pm25: 200,
        activity: 'moderate',
        durationMinutes: 30,
        microenvironment: 'outdoors',
        maskType: 'none',
      });
      const masked = calculateRelativeDose({
        pm25: 200,
        activity: 'moderate',
        durationMinutes: 30,
        microenvironment: 'outdoors',
        maskType: mask,
      });
      expect(masked.relativeDoseUg).toBeLessThanOrEqual(unmasked.relativeDoseUg * maxExpectedRatio + 0.1);
    });
  });

  describe('Microenvironment and vulnerability weights', () => {
    const microCases: MicroEnvironment[] = [
      'indoor_closed',
      'indoor_hepa',
      'car_recirc',
      'car_open',
      'auto_rickshaw',
      'bus',
      'metro',
    ];

    it.each(microCases)('calculates dose for microenvironment %s', (microenvironment) => {
      const res = calculateRelativeDose({
        pm25: 250,
        activity: 'light',
        durationMinutes: 45,
        microenvironment,
        maskType: 'none',
      });
      expect(res.relativeDoseUg).toBeGreaterThan(0);
      expect(res.uncertaintyRangeUg[0]).toBeLessThanOrEqual(res.relativeDoseUg);
      expect(res.relativeDoseUg).toBeLessThanOrEqual(res.uncertaintyRangeUg[1]);
    });

    const vulnCases: VulnerabilityGroup[] = [
      'healthy_adult',
      'child',
      'elderly',
      'respiratory',
      'pregnant',
    ];

    it.each(vulnCases)('applies vulnerability multiplier for %s', (vulnerability) => {
      const adult = calculateRelativeDose({
        pm25: 150,
        activity: 'light',
        durationMinutes: 30,
        microenvironment: 'outdoors',
        maskType: 'none',
        vulnerability: 'healthy_adult',
      });
      const target = calculateRelativeDose({
        pm25: 150,
        activity: 'light',
        durationMinutes: 30,
        microenvironment: 'outdoors',
        maskType: 'none',
        vulnerability,
      });
      expect(target.relativeDoseUg).toBeGreaterThanOrEqual(adult.relativeDoseUg);
    });
  });

  describe('Edge cases and boundary handling', () => {
    it('returns zero dose and 0% change when duration is zero', () => {
      const res = calculateRelativeDose({
        pm25: 300,
        activity: 'moderate',
        durationMinutes: 0,
        microenvironment: 'outdoors',
        maskType: 'none',
      });
      expect(res.relativeDoseUg).toBe(0);
      expect(res.baselineDoseUg).toBe(0);
      expect(res.percentageChange).toBe(0);
      expect(res.uncertaintyRangeUg).toEqual([0, 0]);
    });

    it('clamps negative PM2.5 and negative duration to zero', () => {
      const res = calculateRelativeDose({
        pm25: -50,
        activity: 'heavy',
        durationMinutes: -10,
        microenvironment: 'outdoors',
        maskType: 'none',
      });
      expect(res.relativeDoseUg).toBe(0);
      expect(res.percentageChange).toBe(0);
    });

    it('calculates -95% percentage change for N95 mask outdoors', () => {
      const res = calculateRelativeDose({
        pm25: 200,
        activity: 'light',
        durationMinutes: 60,
        microenvironment: 'outdoors',
        maskType: 'n95',
      });
      expect(res.percentageChange).toBe(-95);
    });

    it('falls back to default assumptions for unknown activity or microenvironment', () => {
      const res = calculateRelativeDose({
        pm25: 100,
        activity: 'unknown' as unknown as ActivityLevel,
        durationMinutes: 30,
        microenvironment: 'unknown' as unknown as MicroEnvironment,
        maskType: 'unknown' as unknown as MaskType,
        vulnerability: 'unknown' as unknown as VulnerabilityGroup,
      });
      expect(res.relativeDoseUg).toBeGreaterThan(0);
    });
  });
});
