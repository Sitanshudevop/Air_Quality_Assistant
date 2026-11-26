// Utilities mapping stored profiles, time block metadata, and grounded facts for RoutineView.
import type { AqiCategory, RoutineItem, RoutinePeriod, UserProfile, VulnerabilityGroup } from '../../domain/types.js';
import type { StoredProfile } from '../../services/profile.types.js';

/** Display label and typical time window for each diurnal routine block. */
export const TIME_BLOCK_META: Readonly<Record<RoutinePeriod, { readonly label: string; readonly window: string }>> = {
  wake: { label: 'Wake-up', window: '06:00 – 07:30' },
  commute: { label: 'Commute', window: '08:00 – 09:30' },
  work_school: { label: 'Work / School', window: '09:30 – 12:30' },
  midday: { label: 'Midday', window: '12:30 – 15:00' },
  exercise: { label: 'Exercise', window: '16:00 – 18:00' },
  cooking: { label: 'Cooking', window: '19:00 – 20:30' },
  evening: { label: 'Evening', window: '20:30 – 22:00' },
  sleep: { label: 'Sleep', window: '22:00 – 06:00' },
};

const VULN_MAP: Readonly<Record<string, VulnerabilityGroup>> = {
  healthy_adult: 'healthy_adult',
  general: 'healthy_adult',
  child: 'child',
  elderly: 'elderly',
  respiratory: 'respiratory',
  asthmatic: 'respiratory',
  pregnant: 'pregnant',
};

function resolveVulnerability(profile?: Partial<StoredProfile>): VulnerabilityGroup {
  if (!profile) return 'healthy_adult';
  const raw = profile.vulnerability ?? (profile.vulnerabilities ? profile.vulnerabilities[0] : undefined);
  return (raw && VULN_MAP[raw]) || 'healthy_adult';
}

/**
 * Normalizes a StoredProfile into the pure domain UserProfile contract.
 *
 * @param profile - Persisted or persona-derived user profile.
 * @returns Domain-compatible UserProfile with normalized commuteMode and vulnerability.
 */
export function mapStoredProfileToDomain(profile?: Partial<StoredProfile>): UserProfile {
  const commute = profile?.commuteMode;
  return {
    vulnerability: resolveVulnerability(profile),
    commuteMode: commute === 'two-wheeler' ? 'two_wheeler' : commute,
    hasPurifier: Boolean(profile?.hasPurifier),
    cookingFuel: profile?.cookingFuel ?? 'lpg',
  };
}

/**
 * Checks whether an outdoor-associated routine block is locked under Severe AQI emergency.
 *
 * @param category - Current CPCB AQI category.
 * @param timeBlock - Diurnal routine block identifier.
 * @returns True if outdoor exposure in this block is locked down.
 */
export function isOutdoorBlockLocked(category: AqiCategory, timeBlock: RoutinePeriod): boolean {
  if (category !== 'Severe') return false;
  return timeBlock === 'exercise' || timeBlock === 'midday' || timeBlock === 'work_school';
}

/**
 * Builds bounded grounding facts array from current AQI and routine items.
 *
 * @param aqi - Current CPCB AQI value.
 * @param category - Current CPCB AQI category.
 * @param items - Deterministic routine items.
 * @returns Grounded fact strings capped at 20 entries and 300 chars each.
 */
export function buildRoutineFacts(
  aqi: number,
  category: AqiCategory,
  items: readonly RoutineItem[]
): string[] {
  const facts: string[] = [`Current estimated AQI is ${Math.round(aqi)} (${category}).`];
  for (const item of items) {
    for (const fact of item.facts) {
      if (facts.length >= 20) return facts;
      facts.push(fact.slice(0, 300));
    }
  }
  return facts;
}
