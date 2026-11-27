// Global language state store, React provider, and hook for English/Hindi switching.
import { createContext, createElement, useContext, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { loadLanguagePreference, saveLanguagePreference, t as translate, type Language } from '../i18n/index.js';

export type { Language };

/** Shape of LanguageContext value. */
export interface LanguageContextValue {
  readonly language: Language;
  readonly setLanguage: (lang: Language) => void;
  readonly toggleLanguage: () => void;
  readonly t: (key: string) => string;
}

type LanguageListener = (lang: Language) => void;
const listeners = new Set<LanguageListener>();
let currentLanguage: Language = loadLanguagePreference();

/**
 * Returns the current module-level language setting.
 *
 * @returns Active Language code ('en' or 'hi').
 */
export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * Updates active application language, persists preference, and notifies subscribers.
 *
 * @param lang - Target language ('en' or 'hi').
 */
export function setLanguage(lang: Language): void {
  currentLanguage = lang === 'hi' ? 'hi' : 'en';
  saveLanguagePreference(currentLanguage);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = currentLanguage;
  }
  for (const listener of listeners) {
    try {
      listener(currentLanguage);
    } catch {
      // Ignore subscriber errors
    }
  }
}

/** React context for localized UI state. */
export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

/** Props for LanguageProvider component. */
export interface LanguageProviderProps {
  readonly children: ReactNode;
  readonly initialLanguage?: Language;
}

/**
 * Provider component supplying reactive English/Hindi localization to the React tree.
 *
 * @param props - Children and optional initial language override.
 * @returns React provider element.
 */
export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps): ReactElement {
  const [language, setLocalLang] = useState<Language>(initialLanguage ?? loadLanguagePreference());

  useEffect(() => {
    currentLanguage = language;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
    const onChange: LanguageListener = (next) => setLocalLang(next);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, [language]);

  const value: LanguageContextValue = {
    language,
    setLanguage: (next) => {
      setLocalLang(next);
      setLanguage(next);
    },
    toggleLanguage: () => {
      const next: Language = language === 'en' ? 'hi' : 'en';
      setLocalLang(next);
      setLanguage(next);
    },
    t: (key) => translate(key, language),
  };

  return createElement(LanguageContext.Provider, { value }, children);
}

/**
 * Hook returning current language, setter, toggle, and scoped translator helper.
 *
 * @returns LanguageContextValue (falls back safely if used outside LanguageProvider).
 */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (ctx) return ctx;
  return {
    language: currentLanguage,
    setLanguage,
    toggleLanguage: () => setLanguage(currentLanguage === 'en' ? 'hi' : 'en'),
    t: (key) => translate(key, currentLanguage),
  };
}
