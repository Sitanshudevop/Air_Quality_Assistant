// Contrast ratio and design token unit tests.
import { describe, it, expect } from 'vitest';
import type { AqiCategory } from '../domain/types.js';
import {
  LIGHT_THEME,
  DARK_THEME,
  LIGHT_AQI_TOKENS,
  DARK_AQI_TOKENS,
  getAqiBandToken,
  getContrastRatio,
  getRelativeLuminance,
} from './tokens.js';

describe('Design Tokens & Contrast', () => {
  it('calculates accurate relative luminance and contrast ratios', () => {
    expect(getRelativeLuminance('#000000')).toBeCloseTo(0, 4);
    expect(getRelativeLuminance('#ffffff')).toBeCloseTo(1, 4);
    expect(getContrastRatio('#ffffff', '#000000')).toBe(21);
    expect(getContrastRatio('#ffffff', '#ffffff')).toBe(1);
  });

  describe('Light Theme Contrast', () => {
    it('meets WCAG AA >= 4.5:1 for light theme text against card background', () => {
      const primaryRatio = getContrastRatio(LIGHT_THEME.textPrimary, LIGHT_THEME.cardBg);
      const secondaryRatio = getContrastRatio(LIGHT_THEME.textSecondary, LIGHT_THEME.cardBg);
      const mutedRatio = getContrastRatio(LIGHT_THEME.textMuted, LIGHT_THEME.cardBg);

      expect(primaryRatio).toBeGreaterThanOrEqual(4.5);
      expect(secondaryRatio).toBeGreaterThanOrEqual(4.5);
      expect(mutedRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA >= 3:1 for light theme controls against background', () => {
      const borderRatio = getContrastRatio(LIGHT_THEME.controlBorder, LIGHT_THEME.cardBg);
      expect(borderRatio).toBeGreaterThanOrEqual(3.0);
    });

    it('meets WCAG AA >= 4.5:1 for brand color against card background', () => {
      const brandRatio = getContrastRatio(LIGHT_THEME.brand, LIGHT_THEME.cardBg);
      expect(brandRatio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Dark Theme Contrast', () => {
    it('meets WCAG AA >= 4.5:1 for dark theme text against card background', () => {
      const primaryRatio = getContrastRatio(DARK_THEME.textPrimary, DARK_THEME.cardBg);
      const secondaryRatio = getContrastRatio(DARK_THEME.textSecondary, DARK_THEME.cardBg);
      const mutedRatio = getContrastRatio(DARK_THEME.textMuted, DARK_THEME.cardBg);

      expect(primaryRatio).toBeGreaterThanOrEqual(4.5);
      expect(secondaryRatio).toBeGreaterThanOrEqual(4.5);
      expect(mutedRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA >= 3:1 for dark theme controls against card background', () => {
      const borderRatio = getContrastRatio(DARK_THEME.controlBorder, DARK_THEME.cardBg);
      expect(borderRatio).toBeGreaterThanOrEqual(3.0);
    });

    it('meets WCAG AA >= 4.5:1 for dark theme brand against card background', () => {
      const brandRatio = getContrastRatio(DARK_THEME.brand, DARK_THEME.cardBg);
      expect(brandRatio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('CPCB AQI Bands Contrast', () => {
    const categories: AqiCategory[] = [
      'Good',
      'Satisfactory',
      'Moderate',
      'Poor',
      'Very Poor',
      'Severe',
    ];

    it('meets WCAG AA >= 4.5:1 text contrast across all 6 light bands', () => {
      for (const cat of categories) {
        const token = LIGHT_AQI_TOKENS[cat];
        const ratio = getContrastRatio(token.text, token.bg);
        expect(ratio, `Light band ${cat} text contrast failed: ${ratio}`).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('meets WCAG AA >= 4.5:1 text contrast across all 6 dark bands', () => {
      for (const cat of categories) {
        const token = DARK_AQI_TOKENS[cat];
        const ratio = getContrastRatio(token.text, token.bg);
        expect(ratio, `Dark band ${cat} text contrast failed: ${ratio}`).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('meets WCAG AA >= 3:1 border contrast for all 6 light bands', () => {
      for (const cat of categories) {
        const token = LIGHT_AQI_TOKENS[cat];
        const ratio = getContrastRatio(token.border, token.bg);
        expect(ratio, `Light band ${cat} border contrast failed: ${ratio}`).toBeGreaterThanOrEqual(3.0);
      }
    });

    it('meets WCAG AA >= 3:1 border contrast for all 6 dark bands', () => {
      for (const cat of categories) {
        const token = DARK_AQI_TOKENS[cat];
        const ratio = getContrastRatio(token.border, token.bg);
        expect(ratio, `Dark band ${cat} border contrast failed: ${ratio}`).toBeGreaterThanOrEqual(3.0);
      }
    });
  });

  describe('getAqiBandToken', () => {
    it('retrieves tokens for category and theme', () => {
      const lightGood = getAqiBandToken('Good', false);
      expect(lightGood.label).toBe('Good');
      expect(lightGood.icon).toBe('🌱');

      const darkSevere = getAqiBandToken('Severe', true);
      expect(darkSevere.label).toBe('Severe');
      expect(darkSevere.icon).toBe('🚨');
    });

    it('falls back to Moderate on unknown category', () => {
      const fallback = getAqiBandToken('Unknown' as unknown as AqiCategory);
      expect(fallback.label).toBe('Moderate');
    });
  });
});
