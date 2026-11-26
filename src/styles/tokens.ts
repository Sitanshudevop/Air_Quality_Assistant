// Color tokens, relative luminance, and WCAG contrast validation helpers.
import type { AqiCategory } from '../domain/types.js';

/** Visual token attributes for a single CPCB AQI band. */
export interface AqiBandToken {
  bg: string;
  border: string;
  text: string;
  label: AqiCategory;
  icon: string;
}

/** Theme token definitions for light mode. */
export const LIGHT_THEME = {
  bgBase: '#f8fafc',
  cardBg: '#ffffff',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#475569',
  controlBorder: '#64748b',
  brand: '#0f766e',
} as const;

/** Theme token definitions for dark mode. */
export const DARK_THEME = {
  bgBase: '#0f172a',
  cardBg: '#1e293b',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  controlBorder: '#94a3b8',
  brand: '#2dd4bf',
} as const;

/** Light theme CPCB AQI band color tokens. */
export const LIGHT_AQI_TOKENS: Record<AqiCategory, AqiBandToken> = {
  Good: { bg: '#ecfdf5', border: '#059669', text: '#065f46', label: 'Good', icon: '🌱' },
  Satisfactory: { bg: '#f0fdfa', border: '#0d9488', text: '#115e59', label: 'Satisfactory', icon: '🛡️' },
  Moderate: { bg: '#fffbeb', border: '#d97706', text: '#78350f', label: 'Moderate', icon: '⚠️' },
  Poor: { bg: '#fff7ed', border: '#ea580c', text: '#7c2d12', label: 'Poor', icon: '🔶' },
  'Very Poor': { bg: '#fff1f2', border: '#e11d48', text: '#881337', label: 'Very Poor', icon: '🛑' },
  Severe: { bg: '#faf5ff', border: '#9333ea', text: '#581c87', label: 'Severe', icon: '🚨' },
};

/** Dark theme CPCB AQI band color tokens. */
export const DARK_AQI_TOKENS: Record<AqiCategory, AqiBandToken> = {
  Good: { bg: '#064e3b', border: '#10b981', text: '#ecfdf5', label: 'Good', icon: '🌱' },
  Satisfactory: { bg: '#134e4a', border: '#14b8a6', text: '#f0fdfa', label: 'Satisfactory', icon: '🛡️' },
  Moderate: { bg: '#78350f', border: '#f59e0b', text: '#fef3c7', label: 'Moderate', icon: '⚠️' },
  Poor: { bg: '#7c2d12', border: '#f97316', text: '#ffedd5', label: 'Poor', icon: '🔶' },
  'Very Poor': { bg: '#881337', border: '#fb7185', text: '#ffe4e6', label: 'Very Poor', icon: '🛑' },
  Severe: { bg: '#581c87', border: '#c084fc', text: '#f3e8ff', label: 'Severe', icon: '🚨' },
};

/**
 * Retrieves the CPCB AQI token set for a given category and theme.
 *
 * @param category - CPCB AQI category.
 * @param isDark - Whether dark mode is active.
 * @returns AQI band token details.
 */
export function getAqiBandToken(category: AqiCategory, isDark = false): AqiBandToken {
  const dictionary = isDark ? DARK_AQI_TOKENS : LIGHT_AQI_TOKENS;
  return dictionary[category] ?? dictionary.Moderate;
}

/** Linearizes an 8-bit sRGB channel to relative luminance space. */
function linearize(val: number): number {
  return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
}

/**
 * Calculates WCAG 2.2 relative luminance for a given hex color string.
 *
 * @param hex - 6-character hex color (e.g. #0284c7).
 * @returns Relative luminance between 0 and 1.
 */
export function getRelativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Calculates WCAG contrast ratio between two hex colors.
 *
 * @param color1 - First hex color.
 * @param color2 - Second hex color.
 * @returns Contrast ratio formatted to two decimal places.
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}
