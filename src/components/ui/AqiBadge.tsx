// CPCB AQI hero badge displaying index, category text, icon, and estimate attribution.
import type { ReactElement } from 'react';
import type { AqiCategory } from '../../domain/types.js';
import { LIGHT_AQI_TOKENS } from '../../styles/tokens.js';

/** Props for AqiBadge component. */
export interface AqiBadgeProps {
  aqi: number;
  category: AqiCategory;
  dominantPollutant?: string;
  isEstimate?: boolean;
  className?: string;
}

const BAND_CLASSES: Record<AqiCategory, string> = {
  Good: 'bg-emerald-50 text-emerald-800 border-emerald-600 dark:bg-emerald-900 dark:text-emerald-50 dark:border-emerald-400',
  Satisfactory:
    'bg-teal-50 text-teal-800 border-teal-600 dark:bg-teal-900 dark:text-teal-50 dark:border-teal-400',
  Moderate:
    'bg-amber-50 text-amber-900 border-amber-600 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-400',
  Poor: 'bg-orange-50 text-orange-900 border-orange-600 dark:bg-orange-900 dark:text-orange-100 dark:border-orange-400',
  'Very Poor':
    'bg-rose-50 text-rose-900 border-rose-600 dark:bg-rose-900 dark:text-rose-100 dark:border-rose-400',
  Severe:
    'bg-purple-50 text-purple-900 border-purple-600 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-400',
};

/**
 * Renders an accessible hero badge for CPCB AQI with non-color-alone cues.
 *
 * @param props - AQI calculation results and display options.
 * @returns React component element.
 */
export function AqiBadge({
  aqi,
  category,
  dominantPollutant = 'PM2.5',
  isEstimate = true,
  className = '',
}: AqiBadgeProps): ReactElement {
  const safeAqi = Math.max(0, Math.min(500, Math.round(aqi)));
  const icon = LIGHT_AQI_TOKENS[category]?.icon ?? '⚠️';
  const colorClass = BAND_CLASSES[category] ?? BAND_CLASSES.Moderate;
  const label = `${isEstimate ? 'Estimated ' : ''}CPCB AQI ${safeAqi}: ${category}, Dominant: ${dominantPollutant}`;

  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-flex flex-col items-center justify-center p-4 rounded-xl border-2 shadow-sm ${colorClass} ${className}`.trim()}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
        <span aria-hidden="true">{icon}</span>
        <span>{isEstimate ? 'Estimated CPCB AQI' : 'CPCB AQI'}</span>
      </div>
      <div className="text-4xl font-extrabold tracking-tight my-1">{safeAqi}</div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-sm font-bold uppercase">{category}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 font-medium">
          {dominantPollutant}
        </span>
      </div>
    </div>
  );
}
