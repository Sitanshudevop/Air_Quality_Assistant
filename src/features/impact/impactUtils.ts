// Transport/lifestyle scenario presets and comparison builders for ImpactView.
import { compareAlternatives } from '../../domain/alternatives.js';
import type {
  AlternativeChoice,
  AlternativeComparisonResult,
  MaskType,
  TransportMode,
  VulnerabilityGroup,
} from '../../domain/types.js';

/** Selectable transport mode display labels. */
export const TRANSPORT_MODE_OPTIONS: ReadonlyArray<{ readonly value: TransportMode; readonly label: string }> = [
  { value: 'two_wheeler_petrol', label: 'Two-Wheeler (Petrol)' },
  { value: 'two_wheeler_ev', label: 'Two-Wheeler (EV)' },
  { value: 'auto_rickshaw', label: 'Auto Rickshaw' },
  { value: 'bus_diesel', label: 'Public Bus (Diesel)' },
  { value: 'bus_ev', label: 'Electric Bus' },
  { value: 'car_petrol', label: 'Car (AC Recirculation)' },
  { value: 'car_ev', label: 'Electric Car (AC)' },
  { value: 'metro', label: 'Metro Rail' },
  { value: 'walk', label: 'Walking' },
];

/** Selectable mask options. */
export const MASK_OPTIONS: ReadonlyArray<{ readonly value: MaskType; readonly label: string }> = [
  { value: 'none', label: 'No Mask' },
  { value: 'cloth', label: 'Cloth Mask' },
  { value: 'surgical', label: 'Surgical Mask' },
  { value: 'n95', label: 'N95 / FFP2' },
];

/** Scenario configuration for a single transport + mask option. */
export interface ScenarioSelection {
  readonly id: string;
  readonly label: string;
  readonly mode: TransportMode;
  readonly maskType: MaskType;
}

/**
 * Clamps commute distance to a safe non-negative range [0, 200] km.
 *
 * @param km - Raw distance input.
 * @returns Clamped distance in km.
 */
export function clampDistanceKm(km: number): number {
  if (!Number.isFinite(km) || km < 0) return 0;
  return Math.min(200, Number(km.toFixed(1)));
}

/** Resolves readable choice title from mode and mask. */
function formatChoiceTitle(prefix: string, mode: TransportMode, mask: MaskType): string {
  const modeLabel = TRANSPORT_MODE_OPTIONS.find((m) => m.value === mode)?.label ?? mode;
  const maskLabel = MASK_OPTIONS.find((m) => m.value === mask)?.label ?? mask;
  return `${prefix}: ${modeLabel} + ${maskLabel}`;
}

/**
 * Evaluates baseline and alternative options using the pure domain alternatives engine.
 *
 * @param params - Baseline, option selections, distance, ambient PM2.5, and vulnerability.
 * @returns Evaluated comparison results for baseline + options.
 */
export function evaluateImpactScenarios(params: {
  readonly baseline: ScenarioSelection;
  readonly options: readonly ScenarioSelection[];
  readonly distanceKm: number;
  readonly pm25: number;
  readonly vulnerability?: VulnerabilityGroup;
}): readonly AlternativeComparisonResult[] {
  const dist = clampDistanceKm(params.distanceKm);
  const toChoice = (sel: ScenarioSelection): AlternativeChoice => ({
    id: sel.id,
    title: formatChoiceTitle(sel.label, sel.mode, sel.maskType),
    mode: sel.mode,
    maskType: sel.maskType,
    distanceKm: dist,
  });

  const baseChoice = toChoice(params.baseline);
  const allChoices = [baseChoice, ...params.options.map(toChoice)];
  return compareAlternatives(baseChoice, allChoices, params.pm25, params.vulnerability);
}

/**
 * Builds grounded fact strings from scenario comparison outputs for AI explanation.
 *
 * @param results - Computed comparison metrics.
 * @param pm25 - Ambient PM2.5 concentration.
 * @returns Fact list bounded to 20 strings.
 */
export function buildImpactFacts(
  results: readonly AlternativeComparisonResult[],
  pm25: number
): string[] {
  const facts = [`Ambient PM2.5 concentration is ${Math.round(pm25)} ug/m3.`];
  for (const r of results) {
    facts.push(
      `${r.title}: ${r.inhaledDoseUg} ug dose (${r.relativeDoseChangePct}% vs baseline), CO2e delta ${r.co2eDeltaGrams}g.`
    );
  }
  return facts.slice(0, 20);
}
