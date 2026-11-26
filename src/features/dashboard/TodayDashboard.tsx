// Today condition dashboard aggregating hero, morning briefing, verdicts, calibration, metrics, and cleaner hours.
import type { ReactElement } from 'react';
import type { AqiCategory, VulnerabilityGroup } from '../../domain/types.js';
import type { DataOrigin, DataStatus } from '../../state/activeConditions.js';
import { DataEmptyState } from '../../components/ui/DataEmptyState.js';
import { DataSkeleton } from '../../components/ui/DataSkeleton.js';
import { DataErrorState } from '../../components/ui/DataErrorState.js';
import { TodayDashboardMeta } from './TodayDashboardMeta.js';
import { KpiRow } from './KpiRow.js';
import { MorningBriefingCard } from '../briefing/MorningBriefingCard.js';
import { ActivityVerdictsCard } from '../verdicts/ActivityVerdictsCard.js';
import { PersonalizePlanCard } from './PersonalizePlanCard.js';
import { CleanerHoursCard } from './CleanerHoursCard.js';
import { PollutantCard, type PollutantValues } from './PollutantCard.js';
import { BenchmarkComparison } from './BenchmarkComparison.js';
import { WeatherMixingFactors } from './WeatherMixingFactors.js';
import type { HourlyAirQualityPoint, WeatherFactors } from '../../services/openMeteo.types.js';
import type { StoredProfile } from '../../services/profile.types.js';

/** Props for TodayDashboard component. */
export interface TodayDashboardProps {
  status?: DataStatus; origin?: DataOrigin; cityName?: string;
  aqi?: number; category?: AqiCategory; dominantPollutant?: string;
  isEstimate?: boolean; pollutants?: PollutantValues; weatherFactors?: Partial<WeatherFactors>;
  sourceLabel?: string; timestamp?: string; errorMessage?: string; className?: string;
  vulnerability?: VulnerabilityGroup; hourlyPoints?: readonly HourlyAirQualityPoint[];
  onFocusSearch?: () => void; onUseLocation?: () => void; onManualReading?: () => void;
  onLaunchDemo?: () => void; onRetry?: () => void; onRefreshCache?: () => void;
  onProfileUpdated?: (profile: StoredProfile) => void;
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
    <div className="space-y-4">
      {vals && <PollutantCard values={vals} />}
      {showBenchmarks && vals && <BenchmarkComparison values={vals} />}
      {props.weatherFactors && (
        <WeatherMixingFactors
          factors={props.weatherFactors}
          origin={props.origin}
          sourceLabel={props.sourceLabel}
        />
      )}
    </div>
  );
}

function DashboardContent(props: TodayDashboardProps): ReactElement {
  return (
    <article
      aria-label="Today Air Quality Condition"
      className={`space-y-6 text-neutral-900 dark:text-neutral-50 ${props.className ?? ''}`.trim()}
    >
      <TodayDashboardMeta
        cityName={props.cityName}
        timestamp={props.timestamp}
        sourceLabel={props.sourceLabel}
        isEstimate={props.isEstimate}
      />
      <KpiRow
        aqi={props.aqi}
        category={props.category}
        dominantPollutant={props.dominantPollutant}
        hourlyPoints={props.hourlyPoints}
      />
      <MorningBriefingCard
        cityName={props.cityName}
        aqi={props.aqi}
        category={props.category}
        vulnerability={props.vulnerability}
        points={props.hourlyPoints}
      />
      <ActivityVerdictsCard
        aqi={props.aqi}
        category={props.category}
        vulnerability={props.vulnerability}
        points={props.hourlyPoints}
      />
      <PersonalizePlanCard onProfileUpdated={props.onProfileUpdated} />
      <CleanerHoursCard points={props.hourlyPoints} onRefresh={props.onRefreshCache} />
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
