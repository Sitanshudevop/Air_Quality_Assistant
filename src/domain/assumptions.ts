// Scientific assumptions, coefficients, units, and literature citations registry.
import type { AssumptionCategory, AssumptionRecord } from './types.js';

/** Typed registry of all 28 scientific assumptions and physical coefficients. */
export const ASSUMPTIONS: Record<string, AssumptionRecord> = {
  ventilation_sleep: { id: 'ventilation_sleep', category: 'ventilation', name: 'Sleep Ventilation Rate', value: 7.0, low: 5.0, high: 9.0, unit: 'L/min', citation: 'US EPA Exposure Factors Handbook (2011) Table 6-1', isEstimate: false },
  ventilation_rest: { id: 'ventilation_rest', category: 'ventilation', name: 'Rest Ventilation Rate', value: 8.0, low: 6.0, high: 10.0, unit: 'L/min', citation: 'US EPA Exposure Factors Handbook (2011) Table 6-1', isEstimate: false },
  ventilation_light: { id: 'ventilation_light', category: 'ventilation', name: 'Light Activity Ventilation Rate', value: 14.0, low: 10.0, high: 19.0, unit: 'L/min', citation: 'US EPA Exposure Factors Handbook (2011) Chapter 6', isEstimate: false },
  ventilation_moderate: { id: 'ventilation_moderate', category: 'ventilation', name: 'Moderate Activity Ventilation Rate', value: 27.0, low: 22.0, high: 35.0, unit: 'L/min', citation: 'US EPA Exposure Factors Handbook (2011) Chapter 6', isEstimate: false },
  ventilation_heavy: { id: 'ventilation_heavy', category: 'ventilation', name: 'Heavy Activity Ventilation Rate', value: 48.0, low: 38.0, high: 60.0, unit: 'L/min', citation: 'US EPA Exposure Factors Handbook (2011) Chapter 6', isEstimate: false },
  env_outdoors: { id: 'env_outdoors', category: 'microenvironment', name: 'Ambient Outdoors', value: 1.0, low: 1.0, high: 1.0, unit: 'ratio', citation: 'CPCB / US EPA Reference baseline', isEstimate: false },
  env_indoor_closed: { id: 'env_indoor_closed', category: 'microenvironment', name: 'Indoor Closed Windows', value: 0.60, low: 0.45, high: 0.75, unit: 'ratio', citation: 'Goel & Kumar (2015) Atmos Environ; Pant et al. (2017)', isEstimate: true },
  env_indoor_hepa: { id: 'env_indoor_hepa', category: 'microenvironment', name: 'Indoor HEPA Filtration', value: 0.15, low: 0.08, high: 0.25, unit: 'ratio', citation: 'Srikrishna (2022) Sci Total Environ; AHAM AC-1', isEstimate: false },
  env_car_recirc: { id: 'env_car_recirc', category: 'microenvironment', name: 'In-Car Closed AC Recirculation', value: 0.25, low: 0.15, high: 0.40, unit: 'ratio', citation: 'Goel & Kumar (2015) Atmos Environ', isEstimate: true },
  env_car_open: { id: 'env_car_open', category: 'microenvironment', name: 'In-Car Open Windows', value: 0.85, low: 0.70, high: 0.95, unit: 'ratio', citation: 'Goel & Kumar (2015) Atmos Environ', isEstimate: true },
  env_auto_rickshaw: { id: 'env_auto_rickshaw', category: 'microenvironment', name: 'Auto-Rickshaw On-Road', value: 0.95, low: 0.85, high: 1.00, unit: 'ratio', citation: 'Apte et al. (2011) Atmos Environ', isEstimate: true },
  env_bus: { id: 'env_bus', category: 'microenvironment', name: 'Public Bus Transit', value: 0.75, low: 0.60, high: 0.90, unit: 'ratio', citation: 'Pant et al. (2017); CRRI bus exposure study', isEstimate: true },
  env_metro: { id: 'env_metro', category: 'microenvironment', name: 'Metro Rail Coach', value: 0.20, low: 0.12, high: 0.30, unit: 'ratio', citation: 'Goel & Kumar (2015); DMRC environmental audit', isEstimate: false },
  mask_none: { id: 'mask_none', category: 'mask', name: 'Unmasked Exposure', value: 0.00, low: 0.00, high: 0.00, unit: 'ratio', citation: 'Physical baseline unmasked', isEstimate: false },
  mask_cloth: { id: 'mask_cloth', category: 'mask', name: 'Double-Layer Cloth Mask', value: 0.25, low: 0.15, high: 0.40, unit: 'ratio', citation: 'Shakya et al. (2017) J Expo Sci Environ Epidemiol', isEstimate: true },
  mask_surgical: { id: 'mask_surgical', category: 'mask', name: '3-Ply Surgical Mask', value: 0.55, low: 0.40, high: 0.70, unit: 'ratio', citation: 'Pan et al. (2021) ACS Nano; Shakya et al. (2017)', isEstimate: true },
  mask_n95: { id: 'mask_n95', category: 'mask', name: 'N95 / FFP2 Respirator', value: 0.95, low: 0.90, high: 0.98, unit: 'ratio', citation: 'NIOSH 42 CFR Part 84 / EN 149:2001', isEstimate: false },
  vuln_healthy_adult: { id: 'vuln_healthy_adult', category: 'vulnerability', name: 'Healthy Adult (18-64)', value: 1.00, low: 1.00, high: 1.00, unit: 'multiplier', citation: 'Baseline reference population', isEstimate: false },
  vuln_child: { id: 'vuln_child', category: 'vulnerability', name: 'Child / Infant (0-12)', value: 1.40, low: 1.20, high: 1.60, unit: 'multiplier', citation: 'WHO AQG (2021); Bateson & Schwartz (2008)', isEstimate: true },
  vuln_elderly: { id: 'vuln_elderly', category: 'vulnerability', name: 'Elderly (65+)', value: 1.30, low: 1.15, high: 1.50, unit: 'multiplier', citation: 'US EPA ISA for Particulate Matter (2019)', isEstimate: true },
  vuln_respiratory: { id: 'vuln_respiratory', category: 'vulnerability', name: 'Asthma / COPD / Heart Condition', value: 1.50, low: 1.30, high: 1.80, unit: 'multiplier', citation: 'Global Burden of Disease (2019); Pope & Dockery', isEstimate: true },
  vuln_pregnant: { id: 'vuln_pregnant', category: 'vulnerability', name: 'Pregnancy', value: 1.25, low: 1.10, high: 1.40, unit: 'multiplier', citation: 'Bekkar et al. (2020) JAMA Network Open', isEstimate: true },
  emission_walk: { id: 'emission_walk', category: 'emission', name: 'Walking / Bicycling', value: 0, low: 0, high: 0, unit: 'g CO2e/pkm', citation: 'Active mobility baseline', isEstimate: false },
  emission_metro: { id: 'emission_metro', category: 'emission', name: 'Metro Rail', value: 28, low: 20, high: 35, unit: 'g CO2e/pkm', citation: 'TERI / DMRC Life-Cycle Study (2020)', isEstimate: false },
  emission_bus: { id: 'emission_bus', category: 'emission', name: 'City Bus Transit', value: 75, low: 50, high: 105, unit: 'g CO2e/pkm', citation: 'India GHG Program / WRI-TERI (2015)', isEstimate: true },
  emission_two_wheeler: { id: 'emission_two_wheeler', category: 'emission', name: 'Petrol 2-Wheeler', value: 45, low: 35, high: 60, unit: 'g CO2e/pkm', citation: 'India GHG Program (2015); ARAI', isEstimate: true },
  emission_auto_rickshaw: { id: 'emission_auto_rickshaw', category: 'emission', name: 'Auto-Rickshaw', value: 65, low: 45, high: 90, unit: 'g CO2e/pkm', citation: 'TERI / CPCB Urban Transport Study (2018)', isEstimate: true },
  emission_car: { id: 'emission_car', category: 'emission', name: 'Private Petrol / Diesel Car', value: 140, low: 110, high: 190, unit: 'g CO2e/pkm', citation: 'India GHG Program / ARAI', isEstimate: true },
};

/**
 * Retrieves a single assumption record by its unique identifier.
 *
 * @param id - Unique identifier of the assumption record.
 * @returns The requested AssumptionRecord.
 * @throws Error if the assumption ID is not registered.
 */
export function getAssumption(id: string): AssumptionRecord {
  const record = ASSUMPTIONS[id];
  if (!record) {
    throw new Error(`Unknown assumption ID: ${id}`);
  }
  return record;
}

/**
 * Retrieves all assumption records belonging to a specific category.
 *
 * @param category - Category to filter assumptions by.
 * @returns Array of AssumptionRecord instances matching category.
 */
export function getAssumptionsByCategory(
  category: AssumptionCategory
): readonly AssumptionRecord[] {
  return Object.values(ASSUMPTIONS).filter((item) => item.category === category);
}
