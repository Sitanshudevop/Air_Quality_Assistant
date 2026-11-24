// Indoor air quality hacks, CADR purifier sizing, and myth-busting registry.
import type { IndoorAction, IndoorParams, IndoorRecommendations, MythBuster, VentilationAdvice } from './types.js';

/** Peer-reviewed scientific myth busting records. */
export const INDOOR_MYTHS: readonly MythBuster[] = [
  { myth: 'Houseplants effectively purify room air of PM2.5 smog.', reality: 'False. Potted plants CADR is <0.05 m3/hr. They do not filter fine particulates.', citation: 'Cummings & Waring (2020) J Expo Sci Environ Epidemiol' },
  { myth: 'Bowls of water or wet towels absorb airborne smog.', reality: 'False. PM2.5 follows aerodynamic streamlines around water; moisture encourages mold spores.', citation: 'WHO Guidelines for Indoor Air Quality: Dampness and Mould (2009)' },
  { myth: 'Closing windows makes a home 100% safe without a purifier.', reality: 'False. Indian building envelope infiltration f is 0.50-0.75 without active filtration.', citation: 'Goel & Kumar (2015) Atmos Environ; Pant et al. (2017)' },
  { myth: 'Burning agarbatti (incense) or dhoop purifies indoor air.', reality: 'False. One incense stick emits >45 mg fine soot, benzene, and formaldehyde.', citation: 'Lin et al. (2008) Bull Environ Contam Toxicol' },
  { myth: 'Running a purifier with windows open cleans the incoming air.', reality: 'False. Open windows create 5-15 ACH of dirty air exchange, overwhelming purifier CADR.', citation: 'AHAM Standard AC-1-2020; US EPA IAQ Guide' },
  { myth: 'Ozone generators and ionizers are superior to HEPA purifiers.', reality: 'False. Ozone is a toxic lung irritant and reacts to form secondary formaldehyde.', citation: 'California Air Resources Board (CARB) Regulation AB 2276' },
];

/**
 * Calculates Clean Air Delivery Rate (CADR) required for target Air Changes per Hour (ACH).
 *
 * @param areaSqFt - Floor area in square feet.
 * @param ceilingHeightFt - Ceiling height in feet (default 9.0 ft).
 * @param targetAch - Target air changes per hour (default 5.0 ACH).
 * @returns Clean Air Delivery Rate in CFM.
 */
export function calculateCadrRequirement(areaSqFt: number, ceilingHeightFt = 9.0, targetAch = 5.0): number {
  if (areaSqFt <= 0) return 0;
  const volumeCuFt = areaSqFt * Math.max(1, ceilingHeightFt);
  return Math.round((volumeCuFt * Math.max(1, targetAch)) / 60);
}

/**
 * Determines natural ventilation recommendation based on outdoor AQI.
 *
 * @param aqi - Outdoor Air Quality Index.
 * @returns Ventilation guidance object.
 */
export function getVentilationRecommendation(aqi: number): VentilationAdvice {
  if (aqi > 400) {
    return { allowed: false, window: 'None', durationMinutes: 0, advice: 'Keep windows sealed; severe outdoor smog presents immediate hazards.' };
  }
  if (aqi > 300) {
    return { allowed: false, window: '13:00 - 13:10 (flush only if CO2 high)', durationMinutes: 10, advice: 'Keep sealed unless stuffy; restrict any flush strictly to peak afternoon thermals.' };
  }
  if (aqi > 200) {
    return { allowed: true, window: '12:30 - 14:30', durationMinutes: 15, advice: 'Brief 15-minute midday cross-ventilation during peak solar boundary layer mixing.' };
  }
  if (aqi > 100) {
    return { allowed: true, window: '11:30 - 15:30', durationMinutes: 30, advice: 'Midday ventilation permitted for 30 minutes during warmer convective hours.' };
  }
  return { allowed: true, window: '10:00 - 17:00', durationMinutes: 60, advice: 'Natural ventilation safe during daylight hours.' };
}

/** Resolves room-specific engineering actions. */
function resolveRoomActions(roomType: IndoorParams['roomType']): readonly IndoorAction[] {
  if (roomType === 'bedroom') {
    return [
      { title: 'Window Weatherstripping', detail: 'Apply rubber V-strip tape along sashes to reduce crack infiltration.', category: 'sealing' },
      { title: 'Breathing Zone Targeting', detail: 'Position purifier 1.0 to 1.8m from pillow blowing clean air toward bed.', category: 'purifier' },
      { title: 'Night Continuous Mode', detail: 'Run purifier on quiet low speed throughout the 8 hours of sleep.', category: 'purifier' },
    ];
  }
  if (roomType === 'kitchen') {
    return [
      { title: 'Exhaust Fan Timing', detail: 'Turn on exhaust 1 minute before lighting burners and keep on 10 minutes after.', category: 'ventilation' },
      { title: 'Door Isolation', detail: 'Keep kitchen door firmly shut to prevent oil smoke spreading into living rooms.', category: 'isolation' },
      { title: 'Lid Cooking', detail: 'Cover pans with tight-fitting lids during tadka and frying to contain aerosols.', category: 'source_control' },
    ];
  }
  return [
    { title: 'Entryway Barrier', detail: 'Enforce shoes-off policy and place scraper mat to block outdoor track-in.', category: 'sealing' },
    { title: 'Central Purifier Placement', detail: 'Place purifier away from walls and curtains for 360-degree room circulation.', category: 'purifier' },
    { title: 'Damp Microfiber Mopping', detail: 'Mop with damp cloth; never dry sweep, which resuspends settled dust for hours.', category: 'cleaning' },
  ];
}

/**
 * Assembles complete indoor air quality recommendations for a given room.
 *
 * @param params - Indoor scenario parameters.
 * @returns Complete indoor recommendations package.
 */
export function getIndoorRecommendations(params: IndoorParams): IndoorRecommendations {
  const cadrCfm = calculateCadrRequirement(params.roomAreaSqFt, params.ceilingHeightFt, 5.0);
  const cadrM3Hr = Math.round(cadrCfm * 1.699);
  const ventilation = getVentilationRecommendation(params.currentOutdoorAqi);
  const actions = resolveRoomActions(params.roomType);

  return {
    cadrRequiredCfm: cadrCfm,
    cadrRequiredM3Hr: cadrM3Hr,
    airChangesPerHourAch: 5.0,
    ventilation,
    actions,
    mythsBusted: INDOOR_MYTHS,
  };
}
