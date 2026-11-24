// Curated household demographic personas representing vulnerable urban groups.
import { deepFreeze } from './generator.js';
import type { DemoPersona, DemoPersonaId } from './types.js';

/** Curated household personas reflecting diverse vulnerabilities and commute modes. */
export const DEMO_PERSONAS: Readonly<Record<DemoPersonaId, DemoPersona>> = deepFreeze({
  toddler_grandparent: {
    id: 'toddler_grandparent',
    name: 'Toddler & Asthmatic Grandparent',
    vulnerabilities: ['child', 'asthmatic'],
    activityLevel: 'rest',
    transitMode: 'car',
    hasPurifier: true,
    description: 'Multi-generational home with high biological vulnerability.',
  },
  commuter_couple: {
    id: 'commuter_couple',
    name: 'Two-Wheeler Commuter Couple',
    vulnerabilities: ['general'],
    activityLevel: 'moderate',
    transitMode: 'two-wheeler',
    hasPurifier: false,
    description: 'Daily two-wheeler commuters with direct exposure to traffic exhaust.',
  },
  school_rwa: {
    id: 'school_rwa',
    name: 'School & RWA Administrator',
    vulnerabilities: ['child', 'elderly'],
    activityLevel: 'light',
    transitMode: 'metro',
    hasPurifier: true,
    description: 'Community administrator setting outdoor playtime and assembly rules.',
  },
});

/**
 * Retrieves a household persona with fallback to toddler_grandparent.
 *
 * @param personaId - Identifier of the persona.
 * @returns Deep frozen DemoPersona object.
 */
export function getPersona(personaId: string): DemoPersona {
  const normalized = personaId.toLowerCase().trim() as DemoPersonaId;
  const persona = DEMO_PERSONAS[normalized] ?? DEMO_PERSONAS.toddler_grandparent;
  return { ...persona, vulnerabilities: [...persona.vulnerabilities] };
}
