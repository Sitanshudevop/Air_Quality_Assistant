// Criteria pollutant concentration card with progressive disclosure and visual bars.
import { useState, type ReactElement } from 'react';

/** Pollutant concentrations for criteria air pollutants. */
export interface PollutantValues {
  pm2_5?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
  o3?: number | null;
}

/** Props for PollutantCard component. */
export interface PollutantCardProps {
  values: PollutantValues;
  className?: string;
}

interface PollutantMeta {
  key: keyof PollutantValues;
  name: string;
  formula: string;
  unit: string;
  maxRef: number;
}

const CRITERIA_POLLUTANTS: readonly PollutantMeta[] = [
  { key: 'pm2_5', name: 'Fine Particulates', formula: 'PM2.5', unit: 'µg/m³', maxRef: 60 },
  { key: 'pm10', name: 'Coarse Particulates', formula: 'PM10', unit: 'µg/m³', maxRef: 100 },
  { key: 'no2', name: 'Nitrogen Dioxide', formula: 'NO₂', unit: 'µg/m³', maxRef: 80 },
  { key: 'so2', name: 'Sulfur Dioxide', formula: 'SO₂', unit: 'µg/m³', maxRef: 80 },
  { key: 'co', name: 'Carbon Monoxide', formula: 'CO', unit: 'mg/m³', maxRef: 4 },
  { key: 'o3', name: 'Ozone', formula: 'O₃', unit: 'µg/m³', maxRef: 100 },
];

function PollutantItem(props: { meta: PollutantMeta; val?: number | null; showDetails: boolean }): ReactElement {
  const { meta, val, showDetails } = props;
  const isNum = typeof val === 'number' && Number.isFinite(val);
  const displayVal = isNum ? Number(Math.max(0, val).toFixed(1)) : '—';
  const pct = isNum ? Math.min(100, Math.round((Math.max(0, val) / meta.maxRef) * 100)) : 0;

  return (
    <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-bold text-bento-ink dark:text-neutral-100">{meta.formula}</span>
        <span className="text-[11px] text-bento-muted dark:text-neutral-400 truncate max-w-[110px]">{meta.name}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-extrabold text-bento-ink dark:text-neutral-50">{displayVal}</span>
        <span className="text-xs text-bento-muted dark:text-neutral-400 font-medium">{meta.unit}</span>
      </div>
      <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
        <div className="bg-bento-ink dark:bg-white h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      {showDetails && (
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 pt-0.5">
          Standard ref: {meta.maxRef} {meta.unit}
        </p>
      )}
    </div>
  );
}

/**
 * Renders a responsive grid displaying the 6 criteria air pollutants with progress bars and expandable details.
 *
 * @param props - Observed pollutant measurements and styling options.
 * @returns React component element.
 */
export function PollutantCard({ values, className = '' }: PollutantCardProps): ReactElement {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  return (
    <section
      aria-label="Criteria Pollutants Breakdown"
      className={`p-6 rounded-3xl bg-bento-canvas/50 dark:bg-neutral-800/40 ${className}`.trim()}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
          Criteria Pollutants Breakdown
        </h3>
        <button
          type="button"
          aria-expanded={showDetails}
          onClick={() => setShowDetails((prev) => !prev)}
          className="text-xs text-teal-800 dark:text-teal-400 hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-teal-600 rounded"
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CRITERIA_POLLUTANTS.map((meta) => (
          <PollutantItem key={meta.key} meta={meta} val={values[meta.key]} showDetails={showDetails} />
        ))}
      </div>
    </section>
  );
}
