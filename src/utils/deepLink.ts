// Strictly allowlisted URL deep-linking parser and builder for tabs, personas, and community templates.
import type { FeatureTabId } from '../components/layout/FeatureTabs.js';
import type { DemoPersonaId } from '../constants/demo/types.js';

/** Supported Community Kit preset template identifiers. */
export type CommunityTemplateId = 'rwa' | 'school' | 'clinic';

/** Parsed and validated deep-link state from URL query parameters. */
export interface DeepLinkState {
  readonly tab?: FeatureTabId;
  readonly persona?: DemoPersonaId;
  readonly template?: CommunityTemplateId;
}

const VALID_TABS = new Set<FeatureTabId>([
  'today',
  'routine',
  'indoor',
  'impact',
  'assistant',
  'community',
]);

const VALID_PERSONAS = new Set<DemoPersonaId>([
  'toddler_grandparent',
  'commuter_couple',
  'school_rwa',
]);

const VALID_TEMPLATES = new Set<CommunityTemplateId>(['rwa', 'school', 'clinic']);

/** Default society/organization names for each allowlisted Community Kit template. */
export const COMMUNITY_TEMPLATE_DEFAULTS: Readonly<Record<CommunityTemplateId, string>> = {
  rwa: 'Green Park RWA',
  school: 'Delhi Public School',
  clinic: 'Neighborhood Health Clinic',
};

/**
 * Parses and validates URL query parameters against strict allowlists.
 * Invalid or unknown values are safely ignored without throwing.
 *
 * @param search - URL query string (e.g. `window.location.search`).
 * @returns Sanitized deep-link state.
 */
export function parseDeepLinkParams(search: string): DeepLinkState {
  if (!search) return {};
  try {
    const params = new URLSearchParams(search);
    const rawTab = params.get('tab') as FeatureTabId | null;
    const rawPersona = params.get('persona') as DemoPersonaId | null;
    const rawTemplate = params.get('template') as CommunityTemplateId | null;

    return {
      tab: rawTab && VALID_TABS.has(rawTab) ? rawTab : undefined,
      persona: rawPersona && VALID_PERSONAS.has(rawPersona) ? rawPersona : undefined,
      template: rawTemplate && VALID_TEMPLATES.has(rawTemplate) ? rawTemplate : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Builds a shareable URL containing allowlisted query parameters.
 *
 * @param baseHref - Current window location href or origin+pathname.
 * @param state - Allowlisted deep-link parameters.
 * @returns Normalized URL string.
 */
export function buildDeepLinkUrl(baseHref: string, state: DeepLinkState): string {
  const url = new URL(baseHref);
  url.search = '';
  if (state.tab && VALID_TABS.has(state.tab)) url.searchParams.set('tab', state.tab);
  if (state.persona && VALID_PERSONAS.has(state.persona)) url.searchParams.set('persona', state.persona);
  if (state.template && VALID_TEMPLATES.has(state.template)) url.searchParams.set('template', state.template);
  return url.toString();
}
