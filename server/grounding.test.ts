// Unit tests for numeric grounding verification and text extraction.
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { verifyNumericGrounding, extractTextForGrounding } from './grounding.js';

describe('Numeric Grounding Verification', () => {
  it.each([
    {
      name: 'matches exact numbers in facts',
      text: 'The AQI is 425 and PM2.5 is 380.',
      facts: ['AQI: 425', 'PM2.5: 380'],
      expected: true,
    },
    {
      name: 'matches decimal equivalence (2.5 vs 2.50)',
      text: 'Measured concentration is 2.50 ug/m3.',
      facts: ['Concentration: 2.5'],
      expected: true,
    },
    {
      name: 'ignores embedded chemical and filter identifiers (PM2.5, PM10, NO2, CO2e, N95)',
      text: 'Wear an N95 mask against PM2.5, PM10, NO2, SO2, O3, and CO2e.',
      facts: ['AQI: 300'],
      expected: true,
    },
    {
      name: 'matches negative percentages from facts',
      text: 'Switching to metro gives -65% exposure.',
      facts: ['Exposure delta: -65%'],
      expected: true,
    },
    {
      name: 'allows text with zero numeric values',
      text: 'Keep windows closed and run the purifier.',
      facts: ['AQI: 300'],
      expected: true,
    },
    {
      name: 'rejects hallucinated numbers absent from facts',
      text: 'The AQI is 999 with 5000 hospitalizations.',
      facts: ['AQI: 425', 'PM2.5: 380'],
      expected: false,
    },
    {
      name: 'rejects numeric response when facts array is empty',
      text: 'The AQI is 200 today.',
      facts: [],
      expected: false,
    },
    {
      name: 'allows numbers supplied via extraAllowedNumbers',
      text: 'Current AQI is 312 in Delhi with 185 PM2.5.',
      facts: [],
      extraAllowedNumbers: [312, '185'],
      expected: true,
    },
  ])('$name', ({ text, facts, extraAllowedNumbers, expected }) => {
    expect(verifyNumericGrounding({ text, facts, extraAllowedNumbers })).toBe(expected);
  });

  it('extracts strings cleanly from nested task outputs', () => {
    const combined = extractTextForGrounding({
      narrative: 'Delhi plan',
      recommendations: ['Wear N95', 'Stay indoors'],
      nested: { note: 'Check 12 PM window', skip: null },
    });
    expect(combined).toContain('Delhi plan');
    expect(combined).toContain('Wear N95');
    expect(combined).toContain('Check 12 PM window');
  });
});
