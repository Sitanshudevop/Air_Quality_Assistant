// WHO 2021 and Indian NAAQS air quality benchmark constants and ratio helpers.

/** Air quality benchmark standard limits for 24-hour exposure. */
export interface BenchmarkLimits {
  pm2_5: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
}

/** Indian National Ambient Air Quality Standards (CPCB 2009). */
export const INDIAN_NAAQS_24H: Readonly<BenchmarkLimits> = {
  pm2_5: 60, // µg/m³
  pm10: 100, // µg/m³
  no2: 80, // µg/m³
  so2: 80, // µg/m³
  co: 2.0, // mg/m³ (8-hour)
  o3: 100, // µg/m³ (8-hour)
};

/** WHO Global Air Quality Guidelines (WHO 2021). */
export const WHO_2021_24H: Readonly<BenchmarkLimits> = {
  pm2_5: 15, // µg/m³
  pm10: 45, // µg/m³
  no2: 25, // µg/m³
  so2: 40, // µg/m³
  co: 4.0, // mg/m³
  o3: 100, // µg/m³ (peak season 8-hour)
};

/** Benchmark citations and official source descriptions. */
export const BENCHMARK_CITATIONS = {
  naaqs: 'CPCB National Ambient Air Quality Standards Notification (2009)',
  who: 'WHO Global Air Quality Guidelines: Particulate Matter and Gases (2021)',
} as const;

/** Computed multiplier comparison result against a benchmark standard. */
export interface BenchmarkRatioResult {
  ratio: number;
  label: string;
  isExceeded: boolean;
}

/**
 * Calculates the concentration-to-standard multiplier for a pollutant.
 *
 * @param concentration - Observed pollutant concentration.
 * @param limit - Regulatory standard or guideline threshold limit.
 * @returns Multiplier ratio and formatted label.
 */
export function calculateBenchmarkRatio(
  concentration: number | undefined | null,
  limit: number
): BenchmarkRatioResult {
  if (
    concentration === undefined ||
    concentration === null ||
    !Number.isFinite(concentration) ||
    !Number.isFinite(limit) ||
    limit <= 0
  ) {
    return { ratio: 0, label: '—', isExceeded: false };
  }
  if (concentration <= 0) {
    return { ratio: 0, label: 'Within guideline', isExceeded: false };
  }

  const rawRatio = concentration / limit;
  const ratio = Number(rawRatio.toFixed(1));
  const isExceeded = ratio > 1.0;
  const percentage = Math.round(rawRatio * 100);
  const label = isExceeded ? `${ratio}x limit` : `Compliant (${percentage}%)`;

  return { ratio, label, isExceeded };
}
