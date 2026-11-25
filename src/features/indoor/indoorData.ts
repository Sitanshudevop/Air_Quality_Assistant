// Room tab configurations, Corsi-Rosenthal guide data, clamping, and citation URLs.
import type { IndoorParams } from '../../domain/types.js';

/** Room tab identifier in IndoorView UI. */
export type IndoorRoomTabId = 'living' | 'bedroom' | 'kitchen' | 'children' | 'office';

/** Room tab metadata mapping UI room tab to domain roomType. */
export interface IndoorRoomTab {
  readonly id: IndoorRoomTabId;
  readonly label: string;
  readonly domainRoomType: IndoorParams['roomType'];
  readonly defaultAreaSqFt: number;
  readonly note: string;
}

/** Ordered room tabs for WAI-ARIA room selector tablist. */
export const INDOOR_ROOM_TABS: readonly IndoorRoomTab[] = [
  {
    id: 'living',
    label: 'Living Room',
    domainRoomType: 'living',
    defaultAreaSqFt: 220,
    note: 'Central shared space; enforce entryway shoe removal and damp mopping.',
  },
  {
    id: 'bedroom',
    label: 'Bedroom',
    domainRoomType: 'bedroom',
    defaultAreaSqFt: 160,
    note: 'Place HEPA purifier 1.0–1.8m from bed headboard for 8h sleep protection.',
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    domainRoomType: 'kitchen',
    defaultAreaSqFt: 110,
    note: 'Keep door shut and exhaust running before and 10 min after cooking.',
  },
  {
    id: 'children',
    label: "Children's Room",
    domainRoomType: 'bedroom',
    defaultAreaSqFt: 140,
    note: 'Children inhale more air per kg body weight; prioritize quiet continuous HEPA filtration.',
  },
  {
    id: 'office',
    label: 'Home Office',
    domainRoomType: 'office',
    defaultAreaSqFt: 120,
    note: 'Seal window gaps and run purifier on medium speed during work hours.',
  },
];

/** DIY Corsi-Rosenthal box construction guide details. */
export const CORSI_ROSENTHAL_GUIDE = {
  title: 'DIY Corsi-Rosenthal Box Purifier (~INR 3,500)',
  materials: [
    'Four 20"×20" MERV-13 pleated HVAC filters (arrows pointing inward)',
    'One 20" thermally protected (UL-listed) box fan',
    'Cardboard base sheet + fan shroud cutout + wide duct tape',
  ],
  steps: [
    'Tape 4 MERV-13 filters into a hollow cube with airflow arrows pointing inward.',
    'Seal the bottom with the solid cardboard base using continuous duct tape.',
    'Mount the box fan on top blowing upward out of the cube and seal corners.',
    'Tape a cardboard shroud over fan blade corners to prevent air backflow.',
  ],
  safetyNote: 'Use only a modern thermally fused box fan; never leave DIY units unattended near curtains.',
} as const;

/** Reference URLs paired by myth index for independent citation verification. */
export const MYTH_CITATION_URLS: readonly string[] = [
  'https://www.epa.gov/indoor-air-quality-iaq',
  'https://www.who.int/publications/i/item/9789241547703',
  'https://www.sciencedirect.com/journal/atmospheric-environment',
  'https://www.epa.gov/indoor-air-quality-iaq/indoor-particulate-matter',
  'https://www.epa.gov/indoor-air-quality-iaq/air-cleaners-and-air-filters-home',
  'https://ww2.arb.ca.gov/our-work/programs/air-cleaners-ozone-products',
];

/**
 * Clamps CADR calculator inputs to physically realistic household room bounds.
 *
 * @param areaSqFt - Raw floor area in square feet.
 * @param ceilingHeightFt - Raw ceiling height in feet.
 * @param targetAch - Raw target air changes per hour.
 * @returns Sanitized, bounded CADR calculation parameters.
 */
export function clampCadrInputs(
  areaSqFt: number,
  ceilingHeightFt: number,
  targetAch: number
): { readonly areaSqFt: number; readonly ceilingHeightFt: number; readonly targetAch: number } {
  const safeArea = Number.isFinite(areaSqFt) ? Math.min(5000, Math.max(10, Math.round(areaSqFt))) : 150;
  const safeHeight = Number.isFinite(ceilingHeightFt) ? Math.min(20, Math.max(6, Number(ceilingHeightFt))) : 9;
  const safeAch = Number.isFinite(targetAch) ? Math.min(12, Math.max(1, Number(targetAch))) : 5;
  return { areaSqFt: safeArea, ceilingHeightFt: safeHeight, targetAch: safeAch };
}
