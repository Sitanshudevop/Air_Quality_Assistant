// Criteria pollutant concentration grid card component.
import type { ReactElement } from 'react';

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
}

const CRITERIA_POLLUTANTS: readonly PollutantMeta[] = [
  { key: 'pm2_5', name: 'Fine Particulates', formula: 'PM2.5', unit: 'µg/m³' },
  { key: 'pm10', name: 'Coarse Particulates', formula: 'PM10', unit: 'µg/m³' },
  { key: 'no2', name: 'Nitrogen Dioxide', formula: 'NO₂', unit: 'µg/m³' },
  { key: 'so2', name: 'Sulfur Dioxide', formula: 'SO₂', unit: 'µg/m³' },
  { key: 'co', name: 'Carbon Monoxide', formula: 'CO', unit: 'mg/m³' },
  { key: 'o3', name: 'Ozone', formula: 'O₃', unit: 'µg/m³' },
];

/**
 * Renders a responsive grid displaying the 6 criteria air pollutants with standardized units.
 *
 * @param props - Observed pollutant measurements and styling options.
 * @returns React component element.
 */
export function PollutantCard({ values, className = '' }: PollutantCardProps): ReactElement {
  return (
    <section
      aria-label="Criteria Pollutants Breakdown"
      className={`p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 ${className}`.trim()}
    >
      <h3 className="text-sm font-semibold mb-3 text-neutral-800 dark:text-neutral-200">
        Criteria Pollutants Breakdown
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CRITERIA_POLLUTANTS.map(({ key, name, formula, unit }) => {
          const val = values[key];
          const displayVal = val !== undefined && val !== null && !Number.isNaN(val)
            ? Number(val.toFixed(1))
            : '—';

          return (
            <div
              key={key}
              className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
            >
              <div className="flex items-baseline justify-between text-xs text-neutral-600 dark:text-neutral-400">
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{formula}</span>
                <span className="text-[11px] truncate max-w-[90px]">{name}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-neutral-900 dark:text-neutral-50">
                  {displayVal}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  {unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
