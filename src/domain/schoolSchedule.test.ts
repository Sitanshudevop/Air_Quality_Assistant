// Unit tests for school schedule precaution domain engine.
import { describe, it, expect } from 'vitest';
import { evaluateSchoolPrecautions } from './schoolSchedule.js';

describe('School Schedule Precaution Domain Engine', () => {
  it('suspends outdoor assembly and sports in Severe air quality (> 250 AQI)', () => {
    const precautions = evaluateSchoolPrecautions(380);
    expect(precautions).toHaveLength(4);

    const assembly = precautions.find((p) => p.id === 'assembly');
    const sports = precautions.find((p) => p.id === 'sports');
    const transit = precautions.find((p) => p.id === 'transit');
    const pickup = precautions.find((p) => p.id === 'pickup');

    expect(assembly?.verdict).toBe('Suspended');
    expect(assembly?.maskRequired).toBe(true);
    expect(sports?.verdict).toBe('Suspended');
    expect(sports?.advice).toContain('yoga');
    expect(transit?.verdict).toBe('Modified');
    expect(pickup?.verdict).toBe('Modified');
  });

  it('permits all normal school activities when air quality is Good (AQI 35)', () => {
    const precautions = evaluateSchoolPrecautions(35);
    for (const p of precautions) {
      expect(p.verdict).toBe('Permitted');
      expect(p.maskRequired).toBe(false);
    }
  });

  it('modifies outdoor assemblies and sports during Moderate to Poor pollution (AQI 180)', () => {
    const precautions = evaluateSchoolPrecautions(180);
    const assembly = precautions.find((p) => p.id === 'assembly');
    const sports = precautions.find((p) => p.id === 'sports');

    expect(assembly?.verdict).toBe('Modified');
    expect(assembly?.advice).toContain('under 10 minutes');
    expect(sports?.verdict).toBe('Modified');
  });
});
