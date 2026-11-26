// Domain engine generating daily "Today at a glance" morning briefings and shareable checklists.
import type { AqiCategory, VulnerabilityGroup } from './types.js';
import type { HourlyAirQualityPoint } from '../services/openMeteo.types.js';

/** Options required to configure and evaluate a morning briefing snapshot. */
export interface MorningBriefingOptions {
  readonly city: string;
  readonly aqi: number;
  readonly category: AqiCategory;
  readonly vulnerability?: VulnerabilityGroup;
  readonly hourlyPoints?: readonly HourlyAirQualityPoint[];
}

/** Structured morning briefing payload for rapid daily air quality orientation. */
export interface MorningBriefing {
  readonly city: string;
  readonly aqi: number;
  readonly category: AqiCategory;
  readonly commuteSafety: string;
  readonly schoolAdvice: string;
  readonly eveningPeak: string;
  readonly checklist: readonly string[];
  readonly shareText: string;
}

function getCommuteGuidance(aqi: number): string {
  if (aqi > 300) {
    return 'High particulate danger on open roads. Avoid two-wheelers; commute via Metro or closed AC car with recirc active. N95 essential.';
  }
  if (aqi > 200) {
    return 'Heavy morning rush-hour stagnation. N95 respirator required for bus, auto, and bike transit.';
  }
  return 'Normal commute conditions. Sensitive groups should wear light protection in high-traffic corridors.';
}

function getSchoolAdvice(aqi: number): string {
  if (aqi > 300) {
    return 'Outdoor morning assemblies and sports periods must be cancelled. Keep school bus windows firmly shut.';
  }
  if (aqi > 200) {
    return 'Outdoor athletic training should be moved indoors. Children should wear certified child-fit respirators in transit.';
  }
  return 'Outdoor school activities and playtime permitted without health restrictions.';
}

function getEveningPeak(points?: readonly HourlyAirQualityPoint[]): string {
  if (points && points.length > 0) {
    let peak = points[0];
    for (const pt of points) {
      if (pt.aqi > peak.aqi) peak = pt;
    }
    const match = peak.time.match(/T(\d{2}:\d{2})/);
    const hour = match ? match[1] : '20:00';
    return `Peak stagnation forecast at ${hour} (Est. AQI ${Math.round(peak.aqi)}). Conclude outdoor trips before sunset.`;
  }
  return 'Thermal inversion peak expected between 19:30 and 22:30. Seal bedroom windows before 18:00.';
}

function getActionChecklist(aqi: number, isVuln: boolean): readonly string[] {
  if (aqi > 300) {
    return [
      'Equip all household members with sealed N95 respirators before opening exterior doors.',
      'Operate bedroom HEPA filtration continuously at maximum ACH and seal balcony drafts.',
      isVuln ? 'Keep rescue inhalers / prescribed bronchoprotective medication within arm reach.' : 'Cancel all non-essential outdoor travel and keep windows sealed.',
    ];
  }
  if (aqi > 150) {
    return [
      'Wear an N95 respirator during commute and active outdoor transit.',
      'Run indoor air purifier on auto mode and restrict window flushing to 13:00 - 15:00.',
      'Avoid high-intensity aerobic exercise outdoors; substitute with indoor light mobility.',
    ];
  }
  return [
    'Good ambient air: open windows for natural morning cross-ventilation.',
    'Ideal conditions for outdoor walks, exercise, and children playground activities.',
    'No personal respirator required for healthy individuals.',
  ];
}

/**
 * Generates an honest, deterministic Morning Briefing tailored to city, AQI, and household demographics.
 *
 * @param options - Briefing configuration including city, AQI, vulnerability, and forecast.
 * @returns Structured briefing object with formatted share text.
 */
export function generateMorningBriefing(options: MorningBriefingOptions): MorningBriefing {
  const { city, aqi, category, vulnerability = 'healthy_adult', hourlyPoints } = options;
  const isVuln = vulnerability !== 'healthy_adult';
  const commuteSafety = getCommuteGuidance(aqi);
  const schoolAdvice = getSchoolAdvice(aqi);
  const eveningPeak = getEveningPeak(hourlyPoints);
  const checklist = getActionChecklist(aqi, isVuln);

  const shareText = [
    `🌬️ Saans Morning Briefing for ${city} (AQI ${aqi} • ${category})`,
    `• Commute: ${commuteSafety}`,
    `• Schools: ${schoolAdvice}`,
    `• Evening Peak: ${eveningPeak}`,
    'Checklist:',
    ...checklist.map((c) => `  ✓ ${c}`),
    'Powered by Saans Urban Air Quality Assistant',
  ].join('\n');

  return {
    city,
    aqi,
    category,
    commuteSafety,
    schoolAdvice,
    eveningPeak,
    checklist,
    shareText,
  };
}
