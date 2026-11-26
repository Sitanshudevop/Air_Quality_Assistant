// Hindi translations, CPCB AQI category labels, and fallback lookup helper.
import type { AqiCategory } from '../domain/types.js';

/** CPCB AQI category names localized to Hindi. */
export const AQI_CATEGORIES_HI: Readonly<Record<AqiCategory, string>> = {
  Good: 'अच्छा',
  Satisfactory: 'संतोषजनक',
  Moderate: 'मध्यम',
  Poor: 'खराब',
  'Very Poor': 'बहुत खराब',
  Severe: 'गंभीर',
};

/** Primary English UI strings keyed by semantic translation ID. */
export const ENGLISH_TRANSLATIONS: Readonly<Record<string, string>> = {
  'app.title': 'Saans',
  'app.subtitle': 'Urban Air Quality Assistant',
  'nav.today': 'Today',
  'nav.routine': 'Daily Routine',
  'nav.indoor': 'Indoor Hacks',
  'nav.impact': 'Impact Explainer',
  'nav.assistant': 'Assistant',
  'nav.community': 'Community Kit',
  'action.print': 'Print Plan',
  'action.tour': 'Tour',
  'action.profile': 'Profile',
  'action.language': 'हिन्दी',
  'routine.title': 'Time-Blocked Daily Routine',
  'indoor.title': 'Indoor Air Quality Hacks',
  'impact.title': 'What If I Choose...?',
  'assistant.title': 'Grounded Air Quality Assistant',
  'community.title': 'Community Smog Action Kit',
  'emergency.contact': 'Emergency Helpline: 112 | Ambulance: 102',
  'disclaimer.medical': 'Informational exposure guidance only. Not medical advice.',
};

/** Hindi UI translations keyed by semantic translation ID. */
export const HINDI_TRANSLATIONS: Readonly<Record<string, string>> = {
  'app.title': 'सांस (Saans)',
  'app.subtitle': 'उत्तर भारतीय सर्दियों के स्मॉग के लिए वायु गुणवत्ता सहायक',
  'nav.today': 'आज',
  'nav.routine': 'दैनिक दिनचर्या',
  'nav.indoor': 'घर के अंदर सुरक्षा',
  'nav.impact': 'प्रभाव तुलना',
  'nav.assistant': 'सहायक चैट',
  'nav.community': 'सामुदायिक किट',
  'action.print': 'योजना प्रिंट करें',
  'action.tour': 'टूर',
  'action.profile': 'प्रोफ़ाइल',
  'action.language': 'English',
  'routine.title': 'समय-आधारित दैनिक दिनचर्या',
  'indoor.title': 'घर के अंदर की हवा सुधारने के उपाय',
  'impact.title': 'अगर मैं चुनूँ...? प्रभाव तुलना',
  'assistant.title': 'वायु गुणवत्ता सहायक चैट',
  'community.title': 'सामुदायिक स्मॉग एक्शन किट',
  'emergency.contact': 'आपातकालीन हेल्पलाइन: 112 | एम्बुलेंस: 102',
  'disclaimer.medical': 'केवल सूचनात्मक मार्गदर्शन। चिकित्सा सलाह नहीं।',
};

/**
 * Translates a UI key for the selected language, falling back to English or the key itself.
 *
 * @param key - Translation dictionary key.
 * @param lang - Target language code ('en' or 'hi').
 * @returns Localized string or fallback key verbatim.
 */
export function t(key: string, lang: 'en' | 'hi' = 'en'): string {
  if (lang === 'hi' && HINDI_TRANSLATIONS[key]) {
    return HINDI_TRANSLATIONS[key];
  }
  return ENGLISH_TRANSLATIONS[key] ?? HINDI_TRANSLATIONS[key] ?? key;
}

/**
 * Translates a CPCB AQI category to Hindi when Hindi mode is active.
 *
 * @param category - CPCB AQI category.
 * @param lang - Target language code.
 * @returns Localized or English category label.
 */
export function translateAqiCategory(category: AqiCategory, lang: 'en' | 'hi' = 'en'): string {
  return lang === 'hi' ? AQI_CATEGORIES_HI[category] : category;
}
