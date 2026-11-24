// Relative inhaled particulate dose calculations and uncertainty estimation.
import { ASSUMPTIONS } from './assumptions.js';
import type { ExposureParams, ExposureResult } from './types.js';

/** Required non-medical disclaimer attached to all exposure calculations. */
export const EXPOSURE_DISCLAIMER =
  'Relative dose estimate based on aerosol physics models. Not medical advice.';

interface ResolvedCoefficients {
  vNom: number; vLow: number; vHigh: number;
  fNom: number; fLow: number; fHigh: number;
  etaNom: number; etaLow: number; etaHigh: number;
  wNom: number; wLow: number; wHigh: number;
}

/**
 * Resolves nominal, low, and high coefficient bounds for exposure calculation.
 *
 * @param params - Exposure parameters.
 * @returns Resolved coefficients bundle.
 */
function resolveCoefficients(params: ExposureParams): ResolvedCoefficients {
  const vRec = ASSUMPTIONS[`ventilation_${params.activity}`] ?? ASSUMPTIONS.ventilation_light;
  const fRec = ASSUMPTIONS[`env_${params.microenvironment}`] ?? ASSUMPTIONS.env_outdoors;
  const etaRec = ASSUMPTIONS[`mask_${params.maskType}`] ?? ASSUMPTIONS.mask_none;
  const vulnKey = params.vulnerability ? `vuln_${params.vulnerability}` : 'vuln_healthy_adult';
  const wRec = ASSUMPTIONS[vulnKey] ?? ASSUMPTIONS.vuln_healthy_adult;

  return {
    vNom: vRec.value / 1000, vLow: vRec.low / 1000, vHigh: vRec.high / 1000,
    fNom: fRec.value, fLow: fRec.low, fHigh: fRec.high,
    etaNom: etaRec.value, etaLow: etaRec.low, etaHigh: etaRec.high,
    wNom: wRec.value, wLow: wRec.low, wHigh: wRec.high,
  };
}

/**
 * Calculates relative inhaled PM2.5 dose (ug), percentage change vs baseline, and uncertainty range.
 *
 * @param params - Scenario exposure parameters.
 * @returns Exposure calculation result with non-medical caveat.
 */
export function calculateRelativeDose(params: ExposureParams): ExposureResult {
  const pm25 = Math.max(0, params.pm25);
  const duration = Math.max(0, params.durationMinutes);
  const coeff = resolveCoefficients(params);

  const dose = pm25 * coeff.vNom * duration * (1 - coeff.etaNom) * coeff.fNom * coeff.wNom;
  const baselineDose = pm25 * coeff.vNom * duration * 1.0 * 1.0 * 1.0;

  const doseLow = pm25 * coeff.vLow * duration * (1 - coeff.etaHigh) * coeff.fLow * coeff.wLow;
  const doseHigh = pm25 * coeff.vHigh * duration * (1 - coeff.etaLow) * coeff.fHigh * coeff.wHigh;

  let percentageChange = 0;
  if (baselineDose > 0) {
    percentageChange = Number((((dose - baselineDose) / baselineDose) * 100).toFixed(1));
  }

  return {
    relativeDoseUg: Number(dose.toFixed(2)),
    baselineDoseUg: Number(baselineDose.toFixed(2)),
    percentageChange,
    uncertaintyRangeUg: [Number(doseLow.toFixed(2)), Number(doseHigh.toFixed(2))],
    caveat: EXPOSURE_DISCLAIMER,
  };
}
