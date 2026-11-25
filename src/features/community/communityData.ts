// Community checklists by CPCB AQI band, input sanitization, phone validation, and notice formatter.
import type { AqiCategory } from '../../domain/types.js';

/** Deterministic RWA/School community actions indexed by CPCB AQI category. */
export const COMMUNITY_ACTIONS_BY_BAND: Readonly<Record<AqiCategory, readonly string[]>> = {
  Good: [
    'Maintain green cover watering and swept entryways to prevent dust buildup.',
    'Encourage walking and cycling clubs during clear daylight hours.',
    'Keep society waste segregation active with zero dry-leaf burning.',
  ],
  Satisfactory: [
    'Water unpaved parking and construction perimeters once daily.',
    'Coordinate school carpools to keep morning gate idling low.',
    'Display daily local AQI updates on the community notice board.',
  ],
  Moderate: [
    'Enforce strict ban on garden leaf and garbage burning within the society.',
    'Require covered tarpaulins on all construction material deliveries.',
    'Schedule heavy school outdoor sports during afternoon mixing hours.',
  ],
  Poor: [
    'Activate RWA dust-suppression sprinkling on internal roads twice daily.',
    'Advise school gates to enforce engine-off zones during drop-off and pickup.',
    'Provide N95 masks to security guards, sanitation staff, and outdoor workers.',
  ],
  'Very Poor': [
    'Halt non-essential society construction and stone cutting immediately.',
    'Move school assemblies and sports strictly indoors with sealed classrooms.',
    'Set up an indoor clean-air room with HEPA/Corsi-Rosenthal filtration for elders.',
  ],
  Severe: [
    'Issue immediate emergency circular suspending all outdoor school and RWA events.',
    'Ban all open combustion, biomass tandoor/heater use, and diesel generator testing.',
    'Distribute N95 respirators to outdoor staff and share 112/102 emergency contacts.',
  ],
};

const WHATSAPP_MAX_CHARS = 1000;

/**
 * Strips HTML tags and non-printable control characters from custom notice fields.
 *
 * @param raw - Untrusted user input string.
 * @returns Sanitized plain text bounded to 100 characters.
 */
export function sanitizeNoticeField(raw: string): string {
  const withoutScripts = raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  const withoutTags = withoutScripts.replace(/<[^>]*>/g, '').trim();
  let clean = '';
  for (let i = 0; i < withoutTags.length; i++) {
    const code = withoutTags.charCodeAt(i);
    if (code >= 32 && code !== 127) clean += withoutTags[i];
  }
  return clean.slice(0, 100);
}

/**
 * Validates optional emergency contact phone format (6-20 phone characters).
 *
 * @param phone - Raw phone string.
 * @returns True if empty or matching valid phone characters.
 */
export function validateEmergencyPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (trimmed.length === 0) return true;
  return /^[+\d\s()-]{6,20}$/.test(trimmed);
}

/**
 * Enforces WhatsApp-friendly character cap on broadcast notice text.
 *
 * @param text - Drafted notice body.
 * @param maxLen - Maximum allowed characters (default 1000).
 * @returns Trimmed string <= maxLen characters.
 */
export function formatWhatsAppNotice(text: string, maxLen = WHATSAPP_MAX_CHARS): string {
  const clean = text.trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, Math.max(0, maxLen - 3))}...`;
}

/**
 * Builds deterministic offline/demo WhatsApp community circular template.
 *
 * @param params - City, AQI, category, society name, and optional emergency phone.
 * @returns Formatted community alert message within WhatsApp length limit.
 */
export function buildOfflineNoticeTemplate(params: {
  readonly cityName: string;
  readonly aqi: number;
  readonly category: AqiCategory;
  readonly societyName: string;
  readonly emergencyPhone: string;
}): string {
  const org = sanitizeNoticeField(params.societyName) || 'Residents & School Community';
  const phone = sanitizeNoticeField(params.emergencyPhone) || '112';
  const actions = COMMUNITY_ACTIONS_BY_BAND[params.category].slice(0, 2).join(' ');
  const body = `[${org}] Air Quality Alert (${params.cityName}): Est. CPCB AQI ${Math.round(params.aqi)} (${params.category}). ${actions} Emergency support: ${phone}.`;
  return formatWhatsAppNotice(body);
}
