// Domain model types, interfaces, category definitions, and options for Saans.

/** CPCB Air Quality Index category bands. */
export type AqiCategory = 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';

/** Monitored criteria particulate pollutants. */
export type Pollutant = 'PM2.5' | 'PM10';

/** CPCB AQI sub-index breakpoint definition. */
export interface Breakpoint {
  readonly cLo: number;
  readonly cHi: number;
  readonly iLo: number;
  readonly iHi: number;
  readonly category: AqiCategory;
}

/** Result of CPCB AQI calculation. */
export interface AqiResult {
  readonly aqi: number;
  readonly category: AqiCategory;
  readonly dominantPollutant: Pollutant;
  readonly isEstimate: true;
  readonly pm25SubIndex: number;
  readonly pm10SubIndex?: number;
}

/** Assumption record categories. */
export type AssumptionCategory = 'ventilation' | 'microenvironment' | 'mask' | 'vulnerability' | 'emission';

/** Typed scientific assumption record with literature citation. */
export interface AssumptionRecord {
  readonly id: string;
  readonly category: AssumptionCategory;
  readonly name: string;
  readonly value: number;
  readonly low: number;
  readonly high: number;
  readonly unit: string;
  readonly citation: string;
  readonly isEstimate: boolean;
}

/** Physical exertion activity levels for ventilation. */
export type ActivityLevel = 'sleep' | 'rest' | 'light' | 'moderate' | 'heavy';

/** Microenvironment exposure location types. */
export type MicroEnvironment = 'outdoors' | 'indoor_closed' | 'indoor_hepa' | 'car_recirc' | 'car_open' | 'auto_rickshaw' | 'bus' | 'metro';

/** Personal mask filtration types. */
export type MaskType = 'none' | 'cloth' | 'surgical' | 'n95';

/** Biological vulnerability demographics. */
export type VulnerabilityGroup = 'healthy_adult' | 'child' | 'elderly' | 'respiratory' | 'pregnant';

/** Parameters for relative inhaled dose computation. */
export interface ExposureParams {
  readonly pm25: number;
  readonly activity?: ActivityLevel;
  readonly activityLevel?: ActivityLevel | string;
  readonly durationMinutes: number;
  readonly microenvironment?: MicroEnvironment;
  readonly environment?: MicroEnvironment | string;
  readonly maskType: MaskType;
  readonly vulnerability?: VulnerabilityGroup;
  readonly vulnerabilityGroup?: string;
}

/** Result of relative inhaled dose computation. */
export interface ExposureResult {
  readonly relativeDoseUg: number;
  readonly relativeDose: number;
  readonly baselineDoseUg: number;
  readonly baselineDose: number;
  readonly percentageChange: number;
  readonly uncertaintyRangeUg: readonly [number, number];
  readonly uncertaintyRange: readonly [number, number];
  readonly caveat: string;
}

/** Diurnal routine time blocks. */
export type RoutinePeriod = 'wake' | 'commute' | 'work_school' | 'midday' | 'exercise' | 'cooking' | 'evening' | 'sleep';

/** Demographic and lifestyle profile of user. */
export interface UserProfile {
  readonly vulnerability?: VulnerabilityGroup;
  readonly commuteMode?: string;
  readonly hasPurifier?: boolean;
  readonly cookingFuel?: 'lpg' | 'induction' | 'biomass';
}

/** Explainable action recommendation item in daily routine. */
export interface RoutineItem {
  readonly id: string;
  readonly timeBlock: RoutinePeriod;
  readonly action: string;
  readonly why: string;
  readonly effort: 'low' | 'medium' | 'high';
  readonly costBand: 'free' | 'low' | 'moderate';
  readonly impactEstimate: string;
  readonly reasonCodes: readonly string[];
  readonly facts: readonly string[];
}

/** Parameters for indoor air quality recommendations. */
export interface IndoorParams {
  readonly roomType: 'bedroom' | 'living' | 'kitchen' | 'classroom' | 'office';
  readonly roomAreaSqFt: number;
  readonly ceilingHeightFt?: number;
  readonly currentOutdoorAqi: number;
  readonly hasPurifier?: boolean;
}

/** Diurnal window natural ventilation advice. */
export interface VentilationAdvice {
  readonly allowed: boolean;
  readonly window: string;
  readonly durationMinutes: number;
  readonly advice: string;
}

/** Evidence-backed myth busting record. */
export interface MythBuster {
  readonly myth: string;
  readonly reality: string;
  readonly citation: string;
}

/** Indoor room action advice. */
export interface IndoorAction {
  readonly title: string;
  readonly detail: string;
  readonly category: string;
}

/** Room-specific indoor recommendations. */
export interface IndoorRecommendations {
  readonly cadrRequiredCfm: number;
  readonly cadrRequiredM3Hr: number;
  readonly airChangesPerHourAch: number;
  readonly ventilation: VentilationAdvice;
  readonly actions: readonly IndoorAction[];
  readonly mythsBusted: readonly MythBuster[];
}

/** Sustainable transport choices. */
export type TransportMode = 'walk' | 'two_wheeler_petrol' | 'two_wheeler_ev' | 'auto_rickshaw' | 'bus_diesel' | 'bus_ev' | 'car_petrol' | 'car_ev' | 'metro';

/** Specification of an alternative choice. */
export interface AlternativeChoice {
  readonly id: string;
  readonly title: string;
  readonly mode: TransportMode;
  readonly maskType: MaskType;
  readonly distanceKm: number;
  readonly durationMinutes?: number;
}

/** Comparison result for an alternative transport choice. */
export interface AlternativeComparisonResult {
  readonly choiceId: string;
  readonly title: string;
  readonly inhaledDoseUg: number;
  readonly relativeDoseChangePct: number;
  readonly doseUncertaintyRangeUg: readonly [number, number];
  readonly co2eGrams: number;
  readonly co2eDeltaGrams: number;
  readonly summary: string;
}
