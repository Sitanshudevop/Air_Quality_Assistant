// Sustainable transport and lifestyle mode comparison with exposure and CO2e deltas.
import { ASSUMPTIONS } from './assumptions.js';
import type { AlternativeChoice, AlternativeComparisonResult, TransportMode, VulnerabilityGroup } from './types.js';

interface ModeSpecs {
  readonly speedKmH: number;
  readonly infiltration: number;
  readonly emissionPerKm: number;
  readonly ventilationRateM3Min: number;
}

const MODE_CONFIG: Record<TransportMode, { speedKmH: number; infiltrationKey: string; emission: number; isModerateVent?: boolean }> = {
  metro: { speedKmH: 35, infiltrationKey: 'env_metro', emission: 28 },
  car_petrol: { speedKmH: 20, infiltrationKey: 'env_car_recirc', emission: 140 },
  car_ev: { speedKmH: 20, infiltrationKey: 'env_car_recirc', emission: 70 },
  bus_diesel: { speedKmH: 15, infiltrationKey: 'env_bus', emission: 75 },
  bus_ev: { speedKmH: 15, infiltrationKey: 'env_bus', emission: 35 },
  two_wheeler_petrol: { speedKmH: 25, infiltrationKey: 'env_auto_rickshaw', emission: 45 },
  two_wheeler_ev: { speedKmH: 25, infiltrationKey: 'env_auto_rickshaw', emission: 22 },
  auto_rickshaw: { speedKmH: 20, infiltrationKey: 'env_auto_rickshaw', emission: 65 },
  walk: { speedKmH: 5, infiltrationKey: 'env_outdoors', emission: 0, isModerateVent: true },
};

/** Resolves speed, infiltration, emission, and ventilation for a transport mode. */
function resolveModeSpecs(mode: TransportMode): ModeSpecs {
  const config = MODE_CONFIG[mode] ?? MODE_CONFIG.walk;
  const infiltration = ASSUMPTIONS[config.infiltrationKey]?.value ?? 1.0;
  const ventKey = config.isModerateVent ? 'ventilation_moderate' : 'ventilation_light';
  const ventRate = (ASSUMPTIONS[ventKey]?.value ?? 14.0) / 1000;

  return {
    speedKmH: config.speedKmH,
    infiltration,
    emissionPerKm: config.emission,
    ventilationRateM3Min: ventRate,
  };
}

/** Computes single trip inhaled dose, uncertainty range, and CO2e emissions. */
function computeChoiceMetrics(
  choice: AlternativeChoice,
  ambientPm25: number,
  vulnMult: number
): { dose: number; doseLow: number; doseHigh: number; co2e: number } {
  const distance = Math.max(0, choice.distanceKm);
  const specs = resolveModeSpecs(choice.mode);
  const duration = choice.durationMinutes ?? (distance > 0 ? (distance / specs.speedKmH) * 60 : 0);
  const maskRec = ASSUMPTIONS[`mask_${choice.maskType}`] ?? ASSUMPTIONS.mask_none;
  const pm25 = Math.max(0, ambientPm25);

  const dose = pm25 * specs.ventilationRateM3Min * duration * (1 - maskRec.value) * specs.infiltration * vulnMult;
  const doseLow = pm25 * (specs.ventilationRateM3Min * 0.8) * duration * (1 - maskRec.high) * (specs.infiltration * 0.8) * vulnMult;
  const doseHigh = pm25 * (specs.ventilationRateM3Min * 1.2) * duration * (1 - maskRec.low) * Math.min(1.0, specs.infiltration * 1.2) * vulnMult;
  const co2e = Math.round(distance * specs.emissionPerKm);

  return { dose, doseLow, doseHigh, co2e };
}

/**
 * Compares multi-modal transport and lifestyle alternatives against a baseline choice.
 *
 * @param baseline - Baseline reference transport choice.
 * @param options - Array of alternative choices to evaluate.
 * @param ambientPm25 - Ambient outdoor PM2.5 concentration in ug/m3.
 * @param vulnerability - Optional biological vulnerability demographic.
 * @returns Array of evaluated comparison results.
 */
export function compareAlternatives(
  baseline: AlternativeChoice,
  options: readonly AlternativeChoice[],
  ambientPm25: number,
  vulnerability?: VulnerabilityGroup
): readonly AlternativeComparisonResult[] {
  const vulnKey = vulnerability ? `vuln_${vulnerability}` : 'vuln_healthy_adult';
  const vulnMult = ASSUMPTIONS[vulnKey]?.value ?? 1.0;
  const baseMetrics = computeChoiceMetrics(baseline, ambientPm25, vulnMult);

  return options.map((opt) => {
    const metrics = computeChoiceMetrics(opt, ambientPm25, vulnMult);
    let relativeDoseChangePct = 0;
    if (baseMetrics.dose > 0) {
      relativeDoseChangePct = Number((((metrics.dose - baseMetrics.dose) / baseMetrics.dose) * 100).toFixed(1));
    }
    const co2eDeltaGrams = metrics.co2e - baseMetrics.co2e;
    const doseSummary = relativeDoseChangePct <= 0
      ? `Reduces personal inhaled PM2.5 dose by ${Math.abs(relativeDoseChangePct)}%`
      : `Increases personal inhaled PM2.5 dose by ${relativeDoseChangePct}%`;
    const co2eSummary = co2eDeltaGrams <= 0
      ? `saves ${Math.abs(co2eDeltaGrams)}g CO2e per trip.`
      : `adds ${co2eDeltaGrams}g CO2e per trip.`;

    return {
      choiceId: opt.id,
      title: opt.title,
      inhaledDoseUg: Number(metrics.dose.toFixed(2)),
      relativeDoseChangePct,
      doseUncertaintyRangeUg: [Number(metrics.doseLow.toFixed(2)), Number(metrics.doseHigh.toFixed(2))],
      co2eGrams: metrics.co2e,
      co2eDeltaGrams,
      summary: `${doseSummary} and ${co2eSummary}`,
    };
  });
}
