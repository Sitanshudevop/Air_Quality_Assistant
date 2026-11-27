// Compact city heading and data provenance metadata bar above the Bento KPI row.
import { memo, type ReactElement } from 'react';
import { Clock, Info } from 'lucide-react';

/** Props for TodayDashboardMeta component. */
export interface TodayDashboardMetaProps {
  readonly cityName?: string;
  readonly timestamp?: string;
  readonly sourceLabel?: string;
  readonly isEstimate?: boolean;
}

/**
 * Renders the active city heading alongside honest timestamp, source, and estimate provenance.
 *
 * @param props - City name, observation timestamp, source label, and estimate flag.
 * @returns React element.
 */
export const TodayDashboardMeta = memo(function TodayDashboardMeta({
  cityName = 'Selected Location',
  timestamp,
  sourceLabel,
  isEstimate,
}: TodayDashboardMetaProps): ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="text-xl font-extrabold tracking-tight text-bento-ink dark:text-white">
          {cityName}
        </h2>
        {isEstimate && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-bento-lavender text-bento-ink">
            <Info size={12} aria-hidden="true" />
            Estimated
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-bento-muted dark:text-neutral-400">
        {timestamp && (
          <span className="inline-flex items-center gap-1">
            <Clock size={12} aria-hidden="true" />
            Observed: {timestamp}
          </span>
        )}
        {sourceLabel && <span>Source: {sourceLabel}</span>}
      </div>
    </div>
  );
});
