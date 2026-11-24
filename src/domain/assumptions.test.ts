// Unit tests for assumptions registry and scientific citations.
import { describe, expect, it } from 'vitest';
import { ASSUMPTIONS, getAssumption, getAssumptionsByCategory } from './assumptions.js';
import type { AssumptionCategory } from './types.js';

describe('Assumptions Registry Domain Module', () => {
  it('contains exactly 28 scientific assumption records', () => {
    const keys = Object.keys(ASSUMPTIONS);
    expect(keys).toHaveLength(28);
  });

  it('asserts every assumption record has valid properties, citations, and bounds', () => {
    for (const [key, record] of Object.entries(ASSUMPTIONS)) {
      expect(record.id).toBe(key);
      expect(record.name).toBeTruthy();
      expect(typeof record.value).toBe('number');
      expect(typeof record.low).toBe('number');
      expect(typeof record.high).toBe('number');
      expect(record.low).toBeLessThanOrEqual(record.value);
      expect(record.value).toBeLessThanOrEqual(record.high);
      expect(record.unit).toBeTruthy();
      expect(record.citation).toBeTruthy();
      expect(typeof record.isEstimate).toBe('boolean');
    }
  });

  describe('getAssumption', () => {
    it('retrieves an existing assumption record by ID', () => {
      const record = getAssumption('mask_n95');
      expect(record.id).toBe('mask_n95');
      expect(record.category).toBe('mask');
      expect(record.value).toBe(0.95);
      expect(record.citation).toContain('NIOSH');
    });

    it('throws descriptive error on unknown assumption ID', () => {
      expect(() => getAssumption('invalid_key')).toThrow('Unknown assumption ID: invalid_key');
    });
  });

  describe('getAssumptionsByCategory', () => {
    const categories: AssumptionCategory[] = [
      'ventilation',
      'microenvironment',
      'mask',
      'vulnerability',
      'emission',
    ];

    it.each(categories)('retrieves assumptions for category %s', (cat) => {
      const records = getAssumptionsByCategory(cat);
      expect(records.length).toBeGreaterThan(0);
      records.forEach((rec) => {
        expect(rec.category).toBe(cat);
      });
    });

    it('sums to 28 across all five categories', () => {
      const total = categories.reduce((sum, cat) => sum + getAssumptionsByCategory(cat).length, 0);
      expect(total).toBe(28);
    });
  });
});
