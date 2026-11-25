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
    {
      name: 'rejects ungrounded Devanagari numerals in Hindi replies',
      text: 'दिल्ली में AQI ४५० है और ९९.९% लोग प्रभावित हैं।',
      facts: ['AQI is 120'],
      expected: false,
    },
    {
      name: 'matches Devanagari numerals against grounded facts',
      text: 'दिल्ली में AQI ४५० है और ९९.९% लोग प्रभावित हैं।',
      facts: ['AQI is 450', 'Affected: 99.9%'],
      expected: true,
    },
    {
      name: 'rejects quoted or tilde-prefixed negative number sign flips',
      text: 'Exposure change is "-99%" and ~-99%.',
      facts: ['Baseline AQI: 99'],
      expected: false,
    },
    {
      name: 'matches quoted negative percentages when grounded',
      text: "Exposure change is '-99%' and `-99%`.",
      facts: ['Exposure delta: -99%'],
      expected: true,
    },
    {
      name: 'normalizes comma-grouped numbers rather than splitting tokens',
      text: 'Over 1,500 people hospitalized.',
      facts: ['Zone 1 AQI: 500'],
      expected: false,
    },
    {
      name: 'matches comma-grouped numbers across text and facts',
      text: 'Total 1,500 residents in 1,50,000 zone.',
      facts: ['Residents: 1500', 'Zone: 1,50,000'],
      expected: true,
    },
    {
      name: 'strips directly attached units like m3/hr, ug/m3, and µg/m3',
      text: 'Purifier CADR needed is 200m3/hr with 180ug/m3 and 180µg/m3.',
      facts: ['Recommended CADR: 200 m3/hr', 'PM2.5: 180'],
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
