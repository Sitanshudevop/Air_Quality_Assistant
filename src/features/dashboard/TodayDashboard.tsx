// Today condition dashboard aggregating AQI, criteria pollutants, benchmarks, and mixing factors.
import type { ReactElement } from 'react';
import type { AqiCategory } from '../../domain/types.js';
import type { DataOrigin, DataStatus } from '../../state/activeConditions.js';
import { AqiBadge } from '../../components/ui/AqiBadge.js';
import { DataEmptyState } from '../../components/ui/DataEmptyState.js';
import { DataSkeleton } from '../../components/ui/DataSkeleton.js';
import { DataErrorState } from '../../components/ui/DataErrorState.js';
import { PollutantCard, type PollutantValues } from './PollutantCard.js';
import { BenchmarkComparison } from './BenchmarkComparison.js';
import { WeatherMixingFactors } from './WeatherMixingFactors.js';
import type { WeatherFactors } from '../../services/openMeteo.types.js';

/** Props for TodayDashboard component. */
export interface TodayDashboardProps {
  status?: DataStatus; origin?: DataOrigin; cityName?: string;
  aqi?: number; category?: AqiCategory; dominantPollutant?: string;
  isEstimate?: boolean; pollutants?: PollutantValues; weatherFactors?: Partial<WeatherFactors>;
  sourceLabel?: string; timestamp?: string; errorMessage?: string; className?: string;
  onFocusSearch?: () => void; onUseLocation?: () => void; onManualReading?: () => void;
  onLaunchDemo?: () => void; onRetry?: () => void;
}

function DashboardHeader(props: { cityName?: string; timestamp?: string; sourceLabel?: string }): ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{props.cityName ?? 'Unknown Location'}</h2>
        {props.timestamp && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Observed: <time>{props.timestamp}</time>
          </p>
        )}
      </div>

      {props.sourceLabel && (
        <span
          role="status"
          className="text-xs px-2.5 py-1 rounded-full font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700"
        >
          Source: {props.sourceLabel}
        </span>
      )}
    </div>
  );
}

function DashboardMetrics(props: {
  pollutants?: PollutantValues;
  weatherFactors?: Partial<WeatherFactors>;
  origin?: DataOrigin;
  sourceLabel?: string;
}): ReactElement {
  const vals = props.pollutants;
  const showBenchmarks = Boolean(vals && (vals.pm2_5 !== undefined || vals.pm10 !== undefined));

  return (
    <>
      {vals && <PollutantCard values={vals} />}
      {showBenchmarks && vals && <BenchmarkComparison values={vals} />}
      {props.weatherFactors && (
        <WeatherMixingFactors
          factors={props.weatherFactors}
          origin={props.origin}
          sourceLabel={props.sourceLabel}
        />
      )}
    </>
  );
}

function DashboardContent(props: TodayDashboardProps): ReactElement {
  const showBadge = props.aqi !== undefined && props.category !== undefined;

  return (
    <article
      aria-label="Today Air Quality Condition"
      className={`space-y-4 text-neutral-900 dark:text-neutral-50 ${props.className ?? ''}`.trim()}
    >
      <DashboardHeader cityName={props.cityName} timestamp={props.timestamp} sourceLabel={props.sourceLabel} />

      {showBadge && (
        <div className="flex flex-col sm:flex-row items-center justify-center p-2">
          <AqiBadge
            aqi={props.aqi!}
            category={props.category!}
            dominantPollutant={props.dominantPollutant}
            isEstimate={props.isEstimate}
            className="w-full sm:max-w-xs"
          />
        </div>
      )}

      <DashboardMetrics
        pollutants={props.pollutants}
        weatherFactors={props.weatherFactors}
        origin={props.origin}
        sourceLabel={props.sourceLabel}
      />
    </article>
  );
}

/**
 * Top-level dashboard card aggregating real-time air quality metrics and plain-language factors.
 *
 * @param props - Air quality, meteorological, provenance data, and UI state handlers.
 * @returns React component element.
 */
export function TodayDashboard(props: TodayDashboardProps): ReactElement {
  const currentStatus = props.status ?? (props.aqi !== undefined ? 'ready' : 'empty');

  if (currentStatus === 'loading') {
    return <DataSkeleton className={props.className} />;
  }

  if (currentStatus === 'error') {
    return (
      <DataErrorState
        message={props.errorMessage}
        onRetry={props.onRetry}
        onManualReading={props.onManualReading}
        className={props.className}
      />
    );
  }

  if (currentStatus === 'empty' || props.aqi === undefined) {
    return (
      <DataEmptyState
        onFocusSearch={props.onFocusSearch}
        onUseLocation={props.onUseLocation}
        onManualReading={props.onManualReading}
        onLaunchDemo={props.onLaunchDemo}
        className={props.className}
      />
    );
  }

  return <DashboardContent {...props} />;
}
