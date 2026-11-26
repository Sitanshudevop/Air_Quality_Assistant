// Cleaner air hours retrospective counter and offline-ready cache status indicator.
import { useState, type ReactElement } from 'react';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';
import { computeCleanerHours } from '../../domain/cleanerHours.js';

/** Props for CleanerHoursCard component. */
export interface CleanerHoursCardProps {
  readonly points?: readonly HourlyAirQualityPoint[];
  readonly onRefresh?: () => void;
  readonly isCached?: boolean;
  readonly className?: string;
}

/**
 * Renders honest cleaner hours retrospective metrics and offline cache status with manual refresh trigger.
 *
 * @param props - Hourly series points, refresh callback, and styling options.
 * @returns React component element or null when points are absent.
 */
export function CleanerHoursCard({
  points = [],
  onRefresh,
  isCached = true,
  className = '',
}: CleanerHoursCardProps): ReactElement | null {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  if (points.length === 0) return null;

  const res = computeCleanerHours(points, 100);

  const handleRefresh = (): void => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <section
      aria-label="Cleaner Hours and Cache Freshness"
      className={`p-5 rounded-[24px] border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Cleaner Air Hours (24h Retrospective)
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Honest count of forecast hours with ambient air below 100 AQI
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCached && (
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              ⚡ Cache Valid (1h TTL)
            </span>
          )}
          {onRefresh && (
            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleRefresh}
              className="text-xs font-semibold px-3 py-1 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-teal-600 transition-colors"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh now ↻'}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-bold text-neutral-900 dark:text-neutral-100">
            {res.cleanHoursCount} of {res.totalHours} evaluated hours
          </span>
          <span className="text-teal-700 dark:text-teal-400 font-extrabold text-sm">
            {res.percentage}% Clean Window
          </span>
        </div>

        <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
          <div
            className="bg-teal-700 dark:bg-teal-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${res.percentage}%` }}
          />
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed pt-1">
          {res.summary}
        </p>
      </div>
    </section>
  );
}
