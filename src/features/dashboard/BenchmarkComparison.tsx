// Side-by-side benchmark comparison against WHO 2021 and Indian NAAQS standards.
import type { ReactElement } from 'react';
import {
  INDIAN_NAAQS_24H,
  WHO_2021_24H,
  calculateBenchmarkRatio,
} from './benchmarkConstants.js';
import type { PollutantValues } from './PollutantCard.js';

/** Props for BenchmarkComparison component. */
export interface BenchmarkComparisonProps {
  values: PollutantValues;
  className?: string;
}

interface BenchmarkRowProps {
  label: string;
  observed: number | undefined | null;
  whoLimit: number;
  naaqsLimit: number;
}

function BenchmarkRow({ label, observed, whoLimit, naaqsLimit }: BenchmarkRowProps): ReactElement {
  const who = calculateBenchmarkRatio(observed, whoLimit);
  const naaqs = calculateBenchmarkRatio(observed, naaqsLimit);
  const displayVal = typeof observed === 'number' && Number.isFinite(observed)
    ? Number(Math.max(0, observed).toFixed(1))
    : '—';

  return (
    <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{label}</span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Observed: <strong className="text-neutral-900 dark:text-neutral-100">{displayVal} µg/m³</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">WHO 2021 ({whoLimit} µg/m³)</div>
          <div className={`font-extrabold mt-0.5 ${who.isExceeded ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {who.label}
          </div>
        </div>

        <div className="p-2 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Indian NAAQS ({naaqsLimit} µg/m³)</div>
          <div className={`font-extrabold mt-0.5 ${naaqs.isExceeded ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {naaqs.label}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compares current particulate concentrations with international and national limits.
 *
 * @param props - Observed pollutant measurements.
 * @returns React component element.
 */
export function BenchmarkComparison({ values, className = '' }: BenchmarkComparisonProps): ReactElement {
  return (
    <section
      aria-label="Health and Regulatory Benchmarks"
      className={`p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 ${className}`.trim()}
    >
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Health &amp; Regulatory Benchmarks
        </h3>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">24-hour limits</span>
      </div>

      <div className="space-y-3">
        <BenchmarkRow
          label="PM2.5 (Fine Particles)"
          observed={values.pm2_5}
          whoLimit={WHO_2021_24H.pm2_5}
          naaqsLimit={INDIAN_NAAQS_24H.pm2_5}
        />
        <BenchmarkRow
          label="PM10 (Coarse Particles)"
          observed={values.pm10}
          whoLimit={WHO_2021_24H.pm10}
          naaqsLimit={INDIAN_NAAQS_24H.pm10}
        />
      </div>
    </section>
  );
}
