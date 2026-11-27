// Unit tests for allowlisted URL deep-link parsing and URL building.
import { describe, it, expect } from 'vitest';
import { buildDeepLinkUrl, parseDeepLinkParams } from './deepLink.js';

describe('deepLink utility', () => {
  it('parses valid allowlisted tab, persona, and template query params', () => {
    const parsed = parseDeepLinkParams('?tab=community&persona=school_rwa&template=school');
    expect(parsed).toEqual({
      tab: 'community',
      persona: 'school_rwa',
      template: 'school',
    });
  });

  it('safely ignores invalid or injected query params without throwing', () => {
    const parsed = parseDeepLinkParams('?tab=<script>&persona=admin&template=../../etc/passwd');
    expect(parsed).toEqual({
      tab: undefined,
      persona: undefined,
      template: undefined,
    });
  });

  it('returns empty object for empty search string', () => {
    expect(parseDeepLinkParams('')).toEqual({});
  });

  it('builds a clean shareable deep-link URL with only allowlisted params', () => {
    const url = buildDeepLinkUrl('https://saans.app/?foo=bar', {
      tab: 'community',
      persona: 'toddler_grandparent',
      template: 'clinic',
    });
    expect(url).toBe('https://saans.app/?tab=community&persona=toddler_grandparent&template=clinic');
    expect(buildDeepLinkUrl('https://saans.app/?foo=bar', {})).toBe('https://saans.app/');
  });
});
