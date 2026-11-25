// Internationalization exports and localStorage language preference persistence.
export {
  AQI_CATEGORIES_HI,
  ENGLISH_TRANSLATIONS,
  HINDI_TRANSLATIONS,
  t,
  translateAqiCategory,
} from './hindi.js';

/** Supported application UI languages. */
export type Language = 'en' | 'hi';

/** LocalStorage key for persisting language choice. */
export const LANGUAGE_STORAGE_KEY = 'saans_language_pref';

/**
 * Saves language preference safely to browser localStorage.
 *
 * @param lang - Selected language ('en' or 'hi').
 */
export function saveLanguagePreference(lang: Language): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  } catch {
    // Ignore storage quota or security errors
  }
}

/**
 * Loads saved language preference from localStorage, defaulting to 'en'.
 *
 * @returns Validated Language code.
 */
export function loadLanguagePreference(): Language {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return raw === 'hi' ? 'hi' : 'en';
    }
  } catch {
    // Ignore storage errors
  }
  return 'en';
}
