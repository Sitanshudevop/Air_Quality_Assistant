// Deterministic daily routine action rules based on AQI and user profile.
import type { AqiCategory, RoutineItem, UserProfile } from './types.js';

/** Builds morning routine items for wake and commute blocks. */
function buildMorningItems(isPoorOrWorse: boolean, isTwoWheeler: boolean): RoutineItem[] {
  const wakeAction = isPoorOrWorse
    ? 'Keep external windows sealed and run bedroom purifier on clean cycle.'
    : 'Ventilate rooms briefly if morning air feels clear and check local AQI.';
  const wakeWhy = isPoorOrWorse
    ? 'Nocturnal thermal inversion traps ground-level particulates below 100m.'
    : 'Early morning conditions allow brief air exchange before morning rush hour.';

  const commuteAction = isTwoWheeler
    ? 'Wear a certified N95 respirator snugly and avoid arterial truck corridors.'
    : 'Keep vehicle windows closed and set air conditioning to internal recirculation.';
  const commuteWhy = isTwoWheeler
    ? 'Two-wheeler commuters face direct on-road tailpipe soot; N95 captures 95% of fine particles.'
    : 'Cabin recirculation mode blocks up to 75% of roadway particulate ingress.';

  return [
    {
      id: 'routine-wake', timeBlock: 'wake', action: wakeAction, why: wakeWhy,
      effort: 'low', costBand: 'free',
      impactEstimate: isPoorOrWorse ? '-40% to -60% morning particle infiltration' : 'Maintains indoor air freshness',
      reasonCodes: ['INVERSION_PEAK', 'SEAL_WINDOWS'],
      facts: ['Morning inversion mixing height is 4x shallower than afternoon', 'Purifier reduces bedroom PM2.5 by 85%'],
    },
    {
      id: 'routine-commute', timeBlock: 'commute', action: commuteAction, why: commuteWhy,
      effort: 'medium', costBand: isTwoWheeler ? 'low' : 'free',
      impactEstimate: isTwoWheeler ? '-95% commuter inhaled particulate dose' : '-75% cabin particulate ingress',
      reasonCodes: [isTwoWheeler ? 'N95_MANDATORY' : 'CAR_RECIRCULATION', 'ROADWAY_EXHAUST'],
      facts: ['Traffic corridor PM2.5 concentrations exceed neighborhood levels by 2-3x', 'N95 mask blocks 95% of aerosols'],
    },
  ];
}

/** Builds daytime routine items for school, midday, and exercise blocks. */
function buildDaytimeItems(isPoorOrWorse: boolean, hasChild: boolean): RoutineItem[] {
  const schoolAction = hasChild && isPoorOrWorse
    ? 'Suspend outdoor morning sports and school assemblies; keep activities in sealed classrooms.'
    : 'Maintain standard indoor classroom learning and avoid outdoor dusty playgrounds.';
  const exerciseAction = isPoorOrWorse
    ? 'Shift workouts indoors (yoga or indoor strength); avoid high-exertion outdoor running.'
    : 'Schedule outdoor exercise between 12:30 PM and 3:30 PM during peak solar convective mixing.';

  return [
    {
      id: 'routine-school', timeBlock: 'work_school', action: schoolAction,
      why: 'Child minute ventilation per kg body mass is 2-3x higher than adults.',
      effort: 'low', costBand: 'free',
      impactEstimate: '-50% child respiratory particle deposition',
      reasonCodes: ['CHILD_VULNERABILITY', 'SCHOOL_OUTDOOR_BAN'],
      facts: ['Children inhale more air relative to body size', 'Classrooms with closed doors cut exposure by 40%'],
    },
    {
      id: 'routine-midday', timeBlock: 'midday',
      action: isPoorOrWorse
        ? 'Keep windows shut; do not open for midday airing if AQI remains above 200.'
        : 'Open windows for a 20-30 minute cross-ventilation window to flush indoor CO2.',
      why: 'Solar surface warming lifts the boundary layer, yielding the lowest diurnal PM2.5.',
      effort: 'low', costBand: 'free',
      impactEstimate: 'Flushes indoor CO2 while managing particulate ingress',
      reasonCodes: ['DIURNAL_SOLAR_WINDOW', 'VENTILATION_TIMING'],
      facts: ['Midday atmospheric mixing height reaches 800-1200m', 'CO2 levels drop without high PM2.5 spike'],
    },
    {
      id: 'routine-exercise', timeBlock: 'exercise', action: exerciseAction,
      why: 'Aerobic exertion increases minute ventilation from 7 L/min to 48 L/min, inhaling 7x more soot.',
      effort: 'medium', costBand: 'free',
      impactEstimate: isPoorOrWorse ? '-85% exercise inhaled dose' : 'Optimizes exercise timing',
      reasonCodes: ['EXERCISE_MODIFICATION', 'HEAVY_VENTILATION'],
      facts: ['Heavy exercise minute ventilation reaches 48 L/min', 'Indoor workouts reduce inhaled PM2.5 significantly'],
    },
  ];
}

/** Builds evening and nighttime routine items for cooking, evening, and sleep blocks. */
function buildNightItems(isGas: boolean): RoutineItem[] {
  return [
    {
      id: 'routine-cooking', timeBlock: 'cooking',
      action: 'Turn exhaust fan on 1 minute before cooking, keep kitchen door closed, and use lids.',
      why: 'High-heat tadka and frying emit PM2.5 spikes exceeding 400 ug/m3 and NO2 from gas flames.',
      effort: 'low', costBand: 'free',
      impactEstimate: '-70% cooking aerosol dispersion to living areas',
      reasonCodes: ['KITCHEN_ISOLATION', 'EXHAUST_MANDATORY'],
      facts: ['Frying oils generate ultra-fine aerosol spikes', isGas ? 'Gas stoves produce NO2 and fine carbon soot' : 'Induction produces zero combustion emissions'],
    },
    {
      id: 'routine-evening', timeBlock: 'evening',
      action: 'Avoid burning agarbatti (incense) or mosquito coils; use electric vaporizers if needed.',
      why: 'One incense stick emits over 40 mg of particulate matter, worse than passive tobacco smoke.',
      effort: 'low', costBand: 'free',
      impactEstimate: 'Eliminates major indoor particulate emission source',
      reasonCodes: ['BAN_INCENSE', 'INDOOR_SOURCE_CONTROL'],
      facts: ['Incense releases 40mg of soot plus benzene and formaldehyde', 'Mosquito coils generate high particulate loads'],
    },
    {
      id: 'routine-sleep', timeBlock: 'sleep',
      action: 'Run bedroom air purifier on low/night mode 1.5m from headboard; damp mop floor before bed.',
      why: 'Sleeping represents 8 hours of continuous exposure; damp mopping prevents dust resuspension.',
      effort: 'low', costBand: 'free',
      impactEstimate: '-80% overnight inhaled particulate dose',
      reasonCodes: ['BEDROOM_PURIFIER_PLACEMENT', 'DAMP_MOPPING'],
      facts: ['8 hours of sleep accounts for 33% of daily inhalation', 'Damp mopping avoids dry dust resuspension'],
    },
  ];
}

/**
 * Generates an explainable 8-period daily routine based on AQI category and profile.
 *
 * @param category - Current or estimated AQI category.
 * @param profile - Optional user demographic and lifestyle profile.
 * @returns Array of explainable routine action items.
 */
export function generateRoutine(category: AqiCategory, profile?: UserProfile): readonly RoutineItem[] {
  const isPoorOrWorse = category === 'Poor' || category === 'Very Poor' || category === 'Severe';
  const isTwoWheeler = profile?.commuteMode === 'two_wheeler';
  const hasChild = profile?.vulnerability === 'child';
  const isGas = profile?.cookingFuel === 'lpg' || profile?.cookingFuel === 'biomass';

  return [
    ...buildMorningItems(isPoorOrWorse, isTwoWheeler),
    ...buildDaytimeItems(isPoorOrWorse, hasChild),
    ...buildNightItems(isGas),
  ];
}
