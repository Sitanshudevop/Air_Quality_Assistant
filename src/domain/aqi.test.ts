// Unit tests for CPCB AQI calculation and breakpoint interpolation.
import { describe, expect, it } from 'vitest';
import { calculateAqi, calculateSubIndex, getAqiCategory, PM25_BREAKPOINTS, PM10_BREAKPOINTS } from './aqi.js';

describe('CPCB AQI Domain Module', () => {
  describe('getAqiCategory', () => {
    const categoryCases = [
      { aqi: 0, expected: 'Good' },
      { aqi: 50, expected: 'Good' },
      { aqi: 51, expected: 'Satisfactory' },
      { aqi: 100, expected: 'Satisfactory' },
      { aqi: 101, expected: 'Moderate' },
      { aqi: 200, expected: 'Moderate' },
      { aqi: 201, expected: 'Poor' },
      { aqi: 300, expected: 'Poor' },
      { aqi: 301, expected: 'Very Poor' },
      { aqi: 400, expected: 'Very Poor' },
      { aqi: 401, expected: 'Severe' },
      { aqi: 500, expected: 'Severe' },
    ] as const;

    it.each(categoryCases)('maps AQI $aqi to $expected', ({ aqi, expected }) => {
      expect(getAqiCategory(aqi)).toBe(expected);
    });
  });

  describe('calculateSubIndex for PM2.5 Breakpoint Boundaries', () => {
    const pm25BoundaryCases = [
      { conc: -10, expected: 0 },
      { conc: 0, expected: 0 },
      { conc: 30, expected: 50 },
      { conc: 31, expected: 51 },
      { conc: 60, expected: 100 },
      { conc: 61, expected: 101 },
      { conc: 90, expected: 200 },
      { conc: 91, expected: 201 },
      { conc: 120, expected: 300 },
      { conc: 121, expected: 301 },
      { conc: 250, expected: 400 },
      { conc: 251, expected: 401 },
      { conc: 380, expected: 500 },
      { conc: 500, expected: 500 },
      { conc: 999, expected: 500 },
    ];

    it.each(pm25BoundaryCases)('calculates PM2.5 sub-index for $conc ug/m3 -> $expected', ({ conc, expected }) => {
      expect(calculateSubIndex(conc, 'PM2.5')).toBe(expected);
    });
  });

  describe('calculateSubIndex for PM10 Breakpoint Boundaries', () => {
    const pm10BoundaryCases = [
      { conc: -25, expected: 0 },
      { conc: 0, expected: 0 },
      { conc: 50, expected: 50 },
      { conc: 51, expected: 51 },
      { conc: 100, expected: 100 },
      { conc: 101, expected: 101 },
      { conc: 250, expected: 200 },
      { conc: 251, expected: 201 },
      { conc: 350, expected: 300 },
      { conc: 351, expected: 301 },
      { conc: 430, expected: 400 },
      { conc: 431, expected: 401 },
      { conc: 500, expected: 500 },
      { conc: 750, expected: 500 },
    ];

    it.each(pm10BoundaryCases)('calculates PM10 sub-index for $conc ug/m3 -> $expected', ({ conc, expected }) => {
      expect(calculateSubIndex(conc, 'PM10')).toBe(expected);
    });
  });

  describe('calculateAqi composite and dominant pollutant', () => {
    it('labels output as estimate', () => {
      const res = calculateAqi(25);
      expect(res.isEstimate).toBe(true);
      expect(res.dominantPollutant).toBe('PM2.5');
      expect(res.category).toBe('Good');
    });

    it('handles dominant pollutant resolution correctly', () => {
      const res = calculateAqi(25, 150);
      expect(res.pm25SubIndex).toBe(42);
      expect(res.pm10SubIndex).toBe(134);
      expect(res.aqi).toBe(134);
      expect(res.dominantPollutant).toBe('PM10');
      expect(res.category).toBe('Moderate');
    });

    it('defaults dominant pollutant to PM2.5 on tie', () => {
      const res = calculateAqi(30, 50);
      expect(res.pm25SubIndex).toBe(50);
      expect(res.pm10SubIndex).toBe(50);
      expect(res.dominantPollutant).toBe('PM2.5');
      expect(res.aqi).toBe(50);
      expect(res.category).toBe('Good');
    });

    it('clamps negative concentrations and caps extreme concentrations at 500', () => {
      const negRes = calculateAqi(-50, -100);
      expect(negRes.aqi).toBe(0);
      expect(negRes.category).toBe('Good');

      const extremeRes = calculateAqi(600, 800);
      expect(extremeRes.aqi).toBe(500);
      expect(extremeRes.category).toBe('Severe');
    });

    it('verifies breakpoint table lengths', () => {
      expect(PM25_BREAKPOINTS).toHaveLength(6);
      expect(PM10_BREAKPOINTS).toHaveLength(6);
    });
  });
});
