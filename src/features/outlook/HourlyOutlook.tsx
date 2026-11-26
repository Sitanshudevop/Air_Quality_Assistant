// Hourly air quality outlook container with chart/table view toggle and window insights.
import { useState, type ReactElement } from 'react';
import { Wind, AlertTriangle } from 'lucide-react';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';
import { AccessibleSvgChart } from './AccessibleSvgChart.js';
import { OutlookDataTable } from './OutlookDataTable.js';
import { findActivityWindows, getOutlookSummary } from './outlookUtils.js';

/** Props for HourlyOutlook component. */
export interface HourlyOutlookProps {
  points?: readonly HourlyAirQualityPoint[];
  className?: string;
}

/**
 * 24-48h hourly outlook container providing dual smooth area SVG chart and accessible table views.
 *
 * @param props - Hourly air quality points and optional container styling.
 * @returns React component element or null when points are empty.
 */
export function HourlyOutlook({ points = [], className = '' }: HourlyOutlookProps): ReactElement | null {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  if (points.length === 0) return null;

  const windows = findActivityWindows(points);
  if (!windows) return null;
  const { best, worst } = windows;
  const summary = getOutlookSummary(points);

  return (
    <section
      aria-label="Next 24 to 48 Hours Hourly Outlook"
      className={`p-6 rounded-3xl bg-bento-canvas/50 dark:bg-neutral-800/40 space-y-4 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-bento-ink dark:text-neutral-100">
            Next 24-48h Hourly Outlook
          </h3>
          <p className="text-xs text-bento-muted dark:text-neutral-400">
            Diurnal curve indicating peak inversion and safe room ventilation windows
          </p>
        </div>

        <div role="group" aria-label="View format switcher" className="inline-flex rounded-full p-1 bg-white dark:bg-neutral-800 shadow-sm">
          <button
            type="button"
            aria-pressed={view === 'chart'}
            onClick={() => setView('chart')}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-colors ${view === 'chart' ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-ink' : 'text-bento-muted hover:text-bento-ink'}`}
          >
            Chart View
          </button>
          <button
            type="button"
            aria-pressed={view === 'table'}
            onClick={() => setView('table')}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-colors ${view === 'table' ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-ink' : 'text-bento-muted hover:text-bento-ink'}`}
          >
            Table View
          </button>
        </div>
      </div>

      <p className="text-xs text-bento-muted dark:text-neutral-300 leading-relaxed">{summary}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-bento-mint dark:bg-emerald-950/40 text-bento-ink dark:text-emerald-200 flex items-start gap-2.5">
          <Wind size={16} className="text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <div className="font-bold">Best Ventilation Window: {best.hourLabel} (Est. AQI {best.aqi})</div>
            <div className="text-[11px] opacity-80 mt-0.5">{best.advice}</div>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-bento-blush dark:bg-rose-950/40 text-bento-ink dark:text-rose-200 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <div className="font-bold">Peak Inversion Alert: {worst.hourLabel} (Est. AQI {worst.aqi})</div>
            <div className="text-[11px] opacity-80 mt-0.5">{worst.advice}</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4">
        {view === 'chart' ? <AccessibleSvgChart points={points} /> : <OutlookDataTable points={points} />}
      </div>
    </section>
  );
}
