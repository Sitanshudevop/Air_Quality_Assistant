// Domain engine evaluating school-day specific precautions across assembly, transit, sports, and pickup.

export type SchoolPrecautionId = 'assembly' | 'transit' | 'sports' | 'pickup';
export type SchoolVerdict = 'Permitted' | 'Modified' | 'Suspended';

/** Structured school precaution recommendation. */
export interface SchoolPrecaution {
  readonly id: SchoolPrecautionId;
  readonly label: string;
  readonly title: string;
  readonly verdict: SchoolVerdict;
  readonly advice: string;
  readonly maskRequired: boolean;
}

function getAssemblyPrecaution(aqi: number): SchoolPrecaution {
  if (aqi > 250) {
    return {
      id: 'assembly',
      label: 'Morning Assembly',
      title: 'Outdoor Assembly Suspended',
      verdict: 'Suspended',
      advice: 'Outdoor morning assembly must be cancelled or conducted inside classrooms via public address system.',
      maskRequired: true,
    };
  }
  if (aqi > 150) {
    return {
      id: 'assembly',
      label: 'Morning Assembly',
      title: 'Assembly Shortened',
      verdict: 'Modified',
      advice: 'Limit assembly to under 10 minutes outdoors; students with respiratory sensitivities must remain indoors.',
      maskRequired: true,
    };
  }
  return {
    id: 'assembly',
    label: 'Morning Assembly',
    title: 'Standard Assembly Allowed',
    verdict: 'Permitted',
    advice: 'Normal outdoor morning assembly permitted under ambient winter conditions.',
    maskRequired: false,
  };
}

function getTransitPrecaution(aqi: number): SchoolPrecaution {
  if (aqi > 250) {
    return {
      id: 'transit',
      label: 'Bus vs Walking Transit',
      title: 'Sealed Transit & N95 Essential',
      verdict: 'Modified',
      advice: 'Bus/van windows must remain sealed. Walking or cycle commute strictly requires fitted child N95/KF94 respirators.',
      maskRequired: true,
    };
  }
  return {
    id: 'transit',
    label: 'Bus vs Walking Transit',
    title: 'Standard School Transit',
    verdict: 'Permitted',
    advice: 'Standard transit safe; students commuting near heavy traffic corridors should wear protective masks.',
    maskRequired: aqi > 100,
  };
}

function getSportsPrecaution(aqi: number): SchoolPrecaution {
  if (aqi > 200) {
    return {
      id: 'sports',
      label: 'Sports & PE Period',
      title: 'Outdoor Sports Suspended',
      verdict: 'Suspended',
      advice: 'Outdoor athletics, running, and soccer drills suspended. Substitute with indoor yoga, table tennis, or chess.',
      maskRequired: true,
    };
  }
  if (aqi > 100) {
    return {
      id: 'sports',
      label: 'Sports & PE Period',
      title: 'Low-Exertion Indoor Drills',
      verdict: 'Modified',
      advice: 'Restrict vigorous aerobic running. Monitor children closely for wheezing or coughing.',
      maskRequired: false,
    };
  }
  return {
    id: 'sports',
    label: 'Sports & PE Period',
    title: 'Outdoor Athletics Permitted',
    verdict: 'Permitted',
    advice: 'Normal outdoor physical education and competitive playground sports allowed.',
    maskRequired: false,
  };
}

function getPickupPrecaution(aqi: number): SchoolPrecaution {
  if (aqi > 250) {
    return {
      id: 'pickup',
      label: 'Afternoon Dismissal & Pickup',
      title: 'Foyer Dismissal Staging',
      verdict: 'Modified',
      advice: 'Keep students inside the covered foyer until vehicles arrive to prevent exposure to idling tailpipe exhaust.',
      maskRequired: true,
    };
  }
  return {
    id: 'pickup',
    label: 'Afternoon Dismissal & Pickup',
    title: 'Normal School Gate Dismissal',
    verdict: 'Permitted',
    advice: 'Standard orderly pickup. Encourage drivers to turn off vehicle engines while waiting.',
    maskRequired: aqi > 100,
  };
}

/**
 * Evaluates school-specific daily protocol recommendations based on active air quality.
 *
 * @param aqi - Active AQI value.
 * @returns Array of 4 structured school precautions.
 */
export function evaluateSchoolPrecautions(aqi: number): readonly SchoolPrecaution[] {
  return [
    getAssemblyPrecaution(aqi),
    getTransitPrecaution(aqi),
    getSportsPrecaution(aqi),
    getPickupPrecaution(aqi),
  ];
}
