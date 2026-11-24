// Unit tests for domain barrel public exports.
import { describe, expect, it } from 'vitest';
import * as Domain from './index.js';

describe('Domain Barrel Export Index', () => {
  it('exports all expected AQI functions and constants', () => {
    expect(typeof Domain.calculateAqi).toBe('function');
    expect(typeof Domain.calculateSubIndex).toBe('function');
    expect(typeof Domain.getAqiCategory).toBe('function');
    expect(Array.isArray(Domain.PM25_BREAKPOINTS)).toBe(true);
    expect(Array.isArray(Domain.PM10_BREAKPOINTS)).toBe(true);
  });

  it('exports all expected assumptions functions and registries', () => {
    expect(typeof Domain.ASSUMPTIONS).toBe('object');
    expect(Object.keys(Domain.ASSUMPTIONS)).toHaveLength(28);
    expect(typeof Domain.getAssumption).toBe('function');
    expect(typeof Domain.getAssumptionsByCategory).toBe('function');
  });

  it('exports exposure dose functions and caveats', () => {
    expect(typeof Domain.calculateRelativeDose).toBe('function');
    expect(typeof Domain.EXPOSURE_DISCLAIMER).toBe('string');
  });

  it('exports routine generation functions', () => {
    expect(typeof Domain.generateRoutine).toBe('function');
  });

  it('exports indoor air quality functions and myth registries', () => {
    expect(typeof Domain.calculateCadrRequirement).toBe('function');
    expect(typeof Domain.getVentilationRecommendation).toBe('function');
    expect(typeof Domain.getIndoorRecommendations).toBe('function');
    expect(Array.isArray(Domain.INDOOR_MYTHS)).toBe(true);
    expect(Domain.INDOOR_MYTHS).toHaveLength(6);
  });

  it('exports alternatives comparison functions', () => {
    expect(typeof Domain.compareAlternatives).toBe('function');
  });
});
