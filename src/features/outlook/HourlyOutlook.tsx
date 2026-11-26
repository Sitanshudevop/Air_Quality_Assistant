// Hourly air quality outlook container with chart/table view toggle and window insights.
import { useState, type ReactElement } from 'react';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';
import { Button } from '../../components/ui/Button.js';
import { AccessibleSvgChart } from './AccessibleSvgChart.js';
import { OutlookDataTable } from './OutlookDataTable.js';
import { findActivityWindows, getOutlookSummary } from './outlookUtils.js';

/** Props for HourlyOutlook component. */
export interface HourlyOutlookProps {
  points?: readonly HourlyAirQualityPoint[];
  className?: string;
}

/**
 * 24-48h hourly outlook container providing dual SVG chart and accessible table representations.
 *
 * @param props - Hourly air quality points and optional container styling.
 * @returns React component element or null when points are empty.
 */
export function HourlyOutlook({
  points = [],
  className = '',
}: HourlyOutlookProps): ReactElement | null {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  if (points.length === 0) {
    return null;
  }

  const windows = findActivityWindows(points);
  if (!windows) {
    return null;
  }
  const { best, worst } = windows;
  const summary = getOutlookSummary(points);

  return (
    <section
      aria-label="Next 24 to 48 Hours Hourly Outlook"
      className={`p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Next 24-48h Hourly Outlook
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Diurnal curve indicating peak inversion and safe room ventilation windows
          </p>
        </div>

        <div role="group" aria-label="View format switcher" className="inline-flex rounded-md p-1 bg-neutral-100 dark:bg-neutral-800">
          <Button
            variant={view === 'chart' ? 'primary' : 'ghost'}
            size="sm"
            aria-pressed={view === 'chart'}
            onClick={() => setView('chart')}
          >
            Chart View
          </Button>
          <Button
            variant={view === 'table' ? 'primary' : 'ghost'}
            size="sm"
            aria-pressed={view === 'table'}
            onClick={() => setView('table')}
          >
            Table View
          </Button>
        </div>
      </div>

      <p className="text-xs text-neutral-700 dark:text-neutral-300 mb-3 bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
        {summary}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
        <div className="p-2.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200">
          <div className="font-semibold">🌿 Best Ventilation Window: {best.hourLabel} (Est. AQI {best.aqi})</div>
          <div className="text-[11px] opacity-90 mt-0.5">{best.advice}</div>
        </div>
        <div className="p-2.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200">
          <div className="font-semibold">🛑 Peak Inversion Alert: {worst.hourLabel} (Est. AQI {worst.aqi})</div>
          <div className="text-[11px] opacity-90 mt-0.5">{worst.advice}</div>
        </div>
      </div>

      <div>
        {view === 'chart' ? (
          <AccessibleSvgChart points={points} />
        ) : (
          <OutlookDataTable points={points} />
        )}
      </div>
    </section>
  );
}
