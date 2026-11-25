// Unit tests for Hindi localization dictionary, fallback lookup, and storage persistence.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AQI_CATEGORIES_HI,
  HINDI_TRANSLATIONS,
  LANGUAGE_STORAGE_KEY,
  loadLanguagePreference,
  saveLanguagePreference,
  t,
  translateAqiCategory,
} from './index.js';

describe('Hindi Localization & i18n Persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('translates all 6 CPCB AQI categories accurately', () => {
    expect(AQI_CATEGORIES_HI.Good).toBe('अच्छा');
    expect(AQI_CATEGORIES_HI.Satisfactory).toBe('संतोषजनक');
    expect(AQI_CATEGORIES_HI.Moderate).toBe('मध्यम');
    expect(AQI_CATEGORIES_HI.Poor).toBe('खराब');
    expect(AQI_CATEGORIES_HI['Very Poor']).toBe('बहुत खराब');
    expect(AQI_CATEGORIES_HI.Severe).toBe('गंभीर');
    expect(translateAqiCategory('Severe', 'hi')).toBe('गंभीर');
    expect(translateAqiCategory('Severe', 'en')).toBe('Severe');
  });

  it('returns translated strings and falls back cleanly for unknown keys', () => {
    expect(HINDI_TRANSLATIONS['nav.today']).toBe('आज');
    expect(t('nav.routine', 'hi')).toBe('दैनिक दिनचर्या');
    expect(t('nav.routine', 'en')).toBe('Daily Routine');
    expect(t('untranslated_random_key_abc', 'hi')).toBe('untranslated_random_key_abc');
  });

  it('persists and loads language preference with safe error fallback', () => {
    expect(loadLanguagePreference()).toBe('en');
    saveLanguagePreference('hi');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('hi');
    expect(loadLanguagePreference()).toBe('hi');

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    expect(() => saveLanguagePreference('en')).not.toThrow();

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(loadLanguagePreference()).toBe('en');
  });
});
