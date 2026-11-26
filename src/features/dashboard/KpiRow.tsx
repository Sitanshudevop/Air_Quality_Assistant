// KPI summary row: Current AQI, Minimum AQI (best window), Peak Inversion AQI, Clean Air Window.
import type { ReactElement } from 'react';
import { Wind, ArrowDownRight, AlertTriangle, Clock3 } from 'lucide-react';
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
  if (cat === 'Good' || cat === 'Satisfactory') return 'bg-bento-mint';
  if (cat === 'Moderate') return 'bg-bento-ice';
  return 'bg-bento-lavender';
}

function MiniSparkline({ points }: { points: readonly HourlyAirQualityPoint[] }): ReactElement {
  const last = points.slice(-12);
  if (last.length < 2) return <div className="h-6" />;
  const vals = last.map((p) => p.aqi);
  const min = Math.min(...vals);
  const range = Math.max(...vals) - min || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * 80},${24 - ((v - min) / range) * 24}`).join(' ');
  return (
    <svg width={80} height={24} aria-hidden="true" viewBox="0 0 80 24">
      <polyline fill="none" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} opacity="0.45" />
    </svg>
  );
}

function findExtremes(points?: readonly HourlyAirQualityPoint[]): { min: { aqi: number; hour: string } | null; peak: { aqi: number; hour: string } | null } {
  if (!points || points.length === 0) return { min: null, peak: null };
  let minPt = points[0];
  let maxPt = points[0];
  for (const pt of points) {
    if (pt.aqi < minPt.aqi) minPt = pt;
    if (pt.aqi > maxPt.aqi) maxPt = pt;
  }
  const fmt = (t: string): string => `${String(new Date(t).getHours()).padStart(2, '0')}:00`;
  return { min: { aqi: Math.round(minPt.aqi), hour: fmt(minPt.time) }, peak: { aqi: Math.round(maxPt.aqi), hour: fmt(maxPt.time) } };
}

function CurrentAqiCard({ aqi, category, dominantPollutant, hourlyPoints }: KpiRowProps): ReactElement {
  return (
    <div className={`${aqiBg(category)} rounded-3xl p-5 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-bento-ink/60 uppercase tracking-wide">Current AQI</span>
        <Wind size={16} className="text-bento-ink/40" aria-hidden="true" />
      </div>
      <p className="text-4xl font-extrabold tracking-tight text-bento-ink" aria-label={`AQI ${aqi ?? '—'}`}>{aqi ?? '—'}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-bento-ink/75">{category ?? 'No data'}</span>
        {dominantPollutant && <span className="text-[11px] font-semibold bg-bento-ink text-white px-2 py-0.5 rounded-full">{dominantPollutant}</span>}
      </div>
      <MiniSparkline points={hourlyPoints ?? []} />
    </div>
  );
}

function RangeCard(props: { title: string; value: string; subtitle: string; bg: string; icon: ReactElement }): ReactElement {
  return (
    <div className={`${props.bg} rounded-3xl p-5 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-bento-ink/60 uppercase tracking-wide">{props.title}</span>
        {props.icon}
      </div>
      <p className="text-4xl font-extrabold tracking-tight text-bento-ink">{props.value}</p>
      <span className="text-xs text-bento-muted font-medium">{props.subtitle}</span>
    </div>
  );
}

function CleanWindowCard({ points }: { points: readonly HourlyAirQualityPoint[] }): ReactElement {
  const clean = points.length > 0 ? computeCleanerHours(points, 100) : null;
  return (
    <div className="bg-bento-ice rounded-3xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-bento-ink/60 uppercase tracking-wide">Clean Air Window</span>
        <Clock3 size={16} className="text-bento-ink/40" aria-hidden="true" />
      </div>
      <p className="text-4xl font-extrabold tracking-tight text-bento-ink">{clean ? `${clean.cleanHoursCount}` : '—'}</p>
      <span className="text-xs text-bento-muted font-medium">{clean ? `of ${clean.totalHours} hrs below 100 AQI` : 'Load forecast for clean hours'}</span>
      {clean && (
        <div className="w-full bg-white/60 h-1.5 rounded-full overflow-hidden">
          <div className="bg-bento-ink h-full rounded-full" style={{ width: `${clean.percentage}%` }} />
        </div>
      )}
    </div>
  );
}

/**
 * Four pastel KPI summary cards: Current AQI, Minimum AQI, Peak Inversion AQI, and Clean Air Window.
 *
 * @param props - AQI data, category, dominant pollutant, and hourly series.
 * @returns React element.
 */
export function KpiRow({ aqi, category, dominantPollutant, hourlyPoints = [] }: KpiRowProps): ReactElement {
  const { min, peak } = findExtremes(hourlyPoints);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <CurrentAqiCard aqi={aqi} category={category} dominantPollutant={dominantPollutant} hourlyPoints={hourlyPoints} />
      <RangeCard title="Minimum AQI" value={min ? `${min.aqi}` : '—'} subtitle={min ? `Best Window @ ${min.hour}` : 'Load forecast for best hour'} bg="bg-bento-mint" icon={<ArrowDownRight size={16} className="text-emerald-700/70" aria-hidden="true" />} />
      <RangeCard title="Peak Inversion" value={peak ? `${peak.aqi}` : '—'} subtitle={peak ? `AQI @ ${peak.hour}` : 'Load forecast for peak'} bg="bg-bento-blush" icon={<AlertTriangle size={16} className="text-rose-700/70" aria-hidden="true" />} />
      <CleanWindowCard points={hourlyPoints} />
    </div>
  );
}
