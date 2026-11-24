// Unit tests for indoor air quality recommendations, CADR sizing, and myths.
import { describe, expect, it } from 'vitest';
import {
  calculateCadrRequirement,
  getIndoorRecommendations,
  getVentilationRecommendation,
  INDOOR_MYTHS,
} from './indoor.js';

describe('Indoor AQI Domain Module', () => {
  describe('calculateCadrRequirement', () => {
    const sizingCases = [
      { area: 100, height: 9, ach: 5, expectedCfm: 75 },
      { area: 150, height: 9, ach: 5, expectedCfm: 113 },
      { area: 200, height: 9, ach: 5, expectedCfm: 150 },
      { area: 300, height: 10, ach: 5, expectedCfm: 250 },
      { area: 0, height: 9, ach: 5, expectedCfm: 0 },
      { area: -50, height: 9, ach: 5, expectedCfm: 0 },
    ];

    it.each(sizingCases)('sizes CADR for $area sq ft -> $expectedCfm CFM', ({ area, height, ach, expectedCfm }) => {
      expect(calculateCadrRequirement(area, height, ach)).toBe(expectedCfm);
    });
  });

  describe('getVentilationRecommendation', () => {
    it('prohibits ventilation when AQI is Severe (>400)', () => {
      const adv = getVentilationRecommendation(450);
      expect(adv.allowed).toBe(false);
      expect(adv.durationMinutes).toBe(0);
      expect(adv.advice).toContain('sealed');
    });

    it('recommends restricted flush when AQI is Very Poor (301-400)', () => {
      const adv = getVentilationRecommendation(350);
      expect(adv.allowed).toBe(false);
      expect(adv.durationMinutes).toBe(10);
      expect(adv.window).toContain('13:00');
    });

    it('permits brief midday cross-ventilation when AQI is Poor (201-300)', () => {
      const adv = getVentilationRecommendation(250);
      expect(adv.allowed).toBe(true);
      expect(adv.durationMinutes).toBe(15);
      expect(adv.window).toContain('12:30');
    });

    it('allows extended ventilation when AQI is Moderate (101-200)', () => {
      const adv = getVentilationRecommendation(150);
      expect(adv.allowed).toBe(true);
      expect(adv.durationMinutes).toBe(30);
    });

    it('allows daylight natural ventilation when AQI is Good or Satisfactory (<=100)', () => {
      const adv = getVentilationRecommendation(70);
      expect(adv.allowed).toBe(true);
      expect(adv.durationMinutes).toBe(60);
    });
  });

  describe('getIndoorRecommendations', () => {
    it('returns comprehensive recommendations for bedroom', () => {
      const rec = getIndoorRecommendations({
        roomType: 'bedroom',
        roomAreaSqFt: 180,
        ceilingHeightFt: 9,
        currentOutdoorAqi: 320,
      });

      expect(rec.cadrRequiredCfm).toBe(135);
      expect(rec.cadrRequiredM3Hr).toBe(229);
      expect(rec.airChangesPerHourAch).toBe(5);
      expect(rec.ventilation.allowed).toBe(false);
      expect(rec.actions.some((a) => a.title.includes('Breathing Zone'))).toBe(true);
      expect(rec.mythsBusted).toHaveLength(6);
    });

    it('returns kitchen-specific isolation actions', () => {
      const rec = getIndoorRecommendations({
        roomType: 'kitchen',
        roomAreaSqFt: 100,
        currentOutdoorAqi: 150,
      });

      expect(rec.actions.some((a) => a.title.includes('Exhaust Fan'))).toBe(true);
      expect(rec.actions.some((a) => a.title.includes('Door Isolation'))).toBe(true);
    });

    it('returns living room entryway actions', () => {
      const rec = getIndoorRecommendations({
        roomType: 'living',
        roomAreaSqFt: 350,
        currentOutdoorAqi: 280,
      });

      expect(rec.actions.some((a) => a.title.includes('Entryway Barrier'))).toBe(true);
      expect(rec.actions.some((a) => a.title.includes('Damp Microfiber Mopping'))).toBe(true);
    });
  });

  describe('INDOOR_MYTHS registry', () => {
    it('contains all 6 peer-reviewed myth busters with non-empty citations', () => {
      expect(INDOOR_MYTHS).toHaveLength(6);
      INDOOR_MYTHS.forEach((m) => {
        expect(m.myth).toBeTruthy();
        expect(m.reality.startsWith('False.')).toBe(true);
        expect(m.citation).toBeTruthy();
      });
    });
  });
});
