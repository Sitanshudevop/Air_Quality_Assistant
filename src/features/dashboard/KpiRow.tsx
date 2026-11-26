// KPI summary row: AQI card, clean-air hours, peak inversion — pastel Bento cards.
import type { ReactElement } from 'react';
import { Wind, Clock3, AlertTriangle } from 'lucide-react';
import type { AqiCategory } from '../../domain/types.js';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';
import { computeCleanerHours } from '../../domain/cleanerHours.js';

/** Props for KpiRow component. */
export interface KpiRowProps {
  readonly aqi?: number;
  readonly category?: AqiCategory;
  readonly dominantPollutant?: string;
  readonly hourlyPoints?: readonly HourlyAirQualityPoint[];
}

function aqiBg(cat?: AqiCategory): string {
  switch (cat) {
    case 'Good': return 'bg-bento-mint';
    case 'Satisfactory': return 'bg-bento-mint';
    case 'Moderate': return 'bg-bento-ice';
    case 'Poor': return 'bg-bento-lavender';
    case 'Very Poor': return 'bg-bento-blush';
    case 'Severe': return 'bg-bento-blush';
    default: return 'bg-bento-lavender';
  }
}

/** Sparkline inline SVG from hourly AQI points (last 12 hours). */
function MiniSparkline(props: { points: readonly HourlyAirQualityPoint[] }): ReactElement {
  const last = props.points.slice(-12);
  if (last.length < 2) return <div className="h-8" />;
  const vals = last.map((p) => p.aqi);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 80;
  const H = 32;
  const pts = vals
    .map((v, i) => `${(i / (vals.length - 1)) * W},${H - ((v - min) / range) * H}`)
    .join(' ');
  return (
    <svg width={W} height={H} aria-hidden="true" viewBox={`0 0 ${W} ${H}`}>
      <polyline fill="none" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} opacity="0.4" />
    </svg>
  );
}

/** Peak inversion hour from hourly points. */
function peakPoint(points?: readonly HourlyAirQualityPoint[]): { aqi: number; hour: string } | null {
  if (!points || points.length === 0) return null;
  const peak = [...points].sort((a, b) => b.aqi - a.aqi)[0];
  if (!peak) return null;
  const h = new Date(peak.time).getHours();
  return { aqi: peak.aqi, hour: `${String(h).padStart(2, '0')}:00` };
}

type CleanResult = ReturnType<typeof computeCleanerHours> | null;

/** Clean air hours KPI card. */
function CleanCard({ clean }: { clean: CleanResult }): ReactElement {
  return (
    <div className="bg-bento-ice rounded-3xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-bento-ink/60 uppercase tracking-wide">Clean Air Window</span>
        <Clock3 size={16} className="text-bento-ink/40" aria-hidden="true" />
      </div>
      <p className="text-5xl font-extrabold tracking-tight text-bento-ink">
        {clean ? `${clean.cleanHoursCount}` : '—'}
      </p>
      <span className="text-xs text-bento-muted font-medium">
        {clean ? `of ${clean.totalHours} hrs below 100 AQI` : 'Load forecast for clean hours'}
      </span>
      {clean && (
        <div className="w-full bg-white/60 h-1.5 rounded-full overflow-hidden">
          <div className="bg-bento-ink h-full rounded-full" style={{ width: `${clean.percentage}%` }} />
        </div>
      )}
    </div>
  );
}

type PeakResult = { aqi: number; hour: string } | null;

/** Peak inversion KPI card. */
function PeakCard({ peak }: { peak: PeakResult }): ReactElement {
  return (
    <div className="bg-bento-blush rounded-3xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-bento-ink/60 uppercase tracking-wide">Peak Inversion</span>
        <AlertTriangle size={16} className="text-bento-ink/40" aria-hidden="true" />
      </div>
      <p className="text-5xl font-extrabold tracking-tight text-bento-ink">
        {peak ? peak.aqi : '—'}
      </p>
      <span className="text-xs text-bento-muted font-medium">
        {peak ? `AQI @ ${peak.hour}` : 'Load forecast for peak'}
      </span>
    </div>
  );
}

/**
 * Three pastel KPI summary cards: current AQI, clean air window, and peak inversion.
 *
 * @param props - AQI data, category, dominant pollutant, and hourly series.
 * @returns React element.
 */
export function KpiRow({ aqi, category, dominantPollutant, hourlyPoints = [] }: KpiRowProps): ReactElement {
  const clean = hourlyPoints.length > 0 ? computeCleanerHours(hourlyPoints, 100) : null;
  const peak = peakPoint(hourlyPoints);
  const bgCls = aqiBg(category);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className={`${bgCls} rounded-3xl p-5 flex flex-col gap-2`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-bento-ink/60 uppercase tracking-wide">Current AQI</span>
          <Wind size={16} className="text-bento-ink/40" aria-hidden="true" />
        </div>
        <p className="text-5xl font-extrabold tracking-tight text-bento-ink" aria-label={`AQI ${aqi ?? '—'}`}>
          {aqi ?? '—'}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-bento-ink/70">{category ?? 'No data'}</span>
          {dominantPollutant && (
            <span className="text-[11px] font-semibold bg-bento-ink text-white px-2 py-0.5 rounded-full">{dominantPollutant}</span>
          )}
        </div>
        <MiniSparkline points={hourlyPoints} />
      </div>
      <CleanCard clean={clean} />
      <PeakCard peak={peak} />
    </div>
  );
}
