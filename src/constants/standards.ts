// Consolidated WHO 2021 and Indian NAAQS air quality standards registry.
import {
  BENCHMARK_CITATIONS,
  INDIAN_NAAQS_24H,
  WHO_2021_24H,
} from '../features/dashboard/benchmarkConstants.js';

/** Official benchmark limits and citations for WHO 2021 and Indian NAAQS 2009. */
export const AIR_STANDARDS = {
  who: WHO_2021_24H,
  naaqs: INDIAN_NAAQS_24H,
  citations: BENCHMARK_CITATIONS,
} as const;
