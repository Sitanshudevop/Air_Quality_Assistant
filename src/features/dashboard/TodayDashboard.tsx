// Today condition dashboard aggregating AQI, criteria pollutants, benchmarks, and mixing factors.
import type { ReactElement } from 'react';
import type { AqiCategory } from '../../domain/types.js';
import { AqiBadge } from '../../components/ui/AqiBadge.js';
import { PollutantCard, type PollutantValues } from './PollutantCard.js';
import { BenchmarkComparison } from './BenchmarkComparison.js';
import { WeatherMixingFactors } from './WeatherMixingFactors.js';
import type { WeatherFactors } from '../../services/openMeteo.types.js';

/** Props for TodayDashboard component. */
export interface TodayDashboardProps {
  cityName?: string;
  aqi?: number;
  category?: AqiCategory;
  dominantPollutant?: string;
  isEstimate?: boolean;
  pollutants?: PollutantValues;
  weatherFactors?: Partial<WeatherFactors>;
  sourceLabel?: string;
  timestamp?: string;
  className?: string;
}

const DEFAULT_POLLUTANTS: PollutantValues = {
  pm2_5: 382.4,
  pm10: 512.1,
  no2: 84.2,
  so2: 12.5,
  co: 2.4,
  o3: 45.0,
};

const DEFAULT_WEATHER: Partial<WeatherFactors> = {
  temperature: 16,
  humidity: 82,
  windSpeed: 0.9,
  surfacePressure: 1016,
  isInversion: true,
};

const DASHBOARD_DEFAULTS = {
  cityName: 'Delhi, NCR',
  aqi: 425,
  category: 'Severe' as AqiCategory,
  dominantPollutant: 'PM2.5',
  isEstimate: true,
  pollutants: DEFAULT_POLLUTANTS,
  weatherFactors: DEFAULT_WEATHER,
  sourceLabel: 'Curated Demo Snapshot (Delhi)',
  timestamp: '24 Nov 2026, 08:30 IST',
  className: '',
};

/**
 * Top-level dashboard card aggregating real-time air quality metrics and plain-language factors.
 *
 * @param props - Air quality, meteorological, and provenance data.
 * @returns React component element.
 */
export function TodayDashboard(props: TodayDashboardProps): ReactElement {
  const d = { ...DASHBOARD_DEFAULTS, ...props };

  return (
    <article
      aria-label="Today Air Quality Condition"
      className={`space-y-4 text-neutral-900 dark:text-neutral-50 ${d.className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{d.cityName}</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Observed: <time>{d.timestamp}</time>
          </p>
        </div>

        <span
          role="status"
          className="text-xs px-2.5 py-1 rounded-full font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700"
        >
          Source: {d.sourceLabel}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center p-2">
        <AqiBadge
          aqi={d.aqi}
          category={d.category}
          dominantPollutant={d.dominantPollutant}
          isEstimate={d.isEstimate}
          className="w-full sm:max-w-xs"
        />
      </div>

      <PollutantCard values={d.pollutants} />
      <BenchmarkComparison values={d.pollutants} />
      <WeatherMixingFactors factors={d.weatherFactors} />
    </article>
  );
}
