// Side-by-side benchmark comparison against WHO 2021 and Indian NAAQS standards.
import { memo, type ReactElement } from 'react';
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
    <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900">
      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="font-bold text-bento-ink dark:text-neutral-100">{label}</span>
        <span className="text-bento-muted dark:text-neutral-400">
          Observed: <strong className="text-bento-ink dark:text-neutral-100">{displayVal} µg/m³</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-bento-canvas/60 dark:bg-neutral-800">
          <div className="text-[11px] text-bento-muted dark:text-neutral-400">WHO 2021 ({whoLimit} µg/m³)</div>
          <div className={`font-extrabold mt-0.5 ${who.isExceeded ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {who.label}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-bento-canvas/60 dark:bg-neutral-800">
          <div className="text-[11px] text-bento-muted dark:text-neutral-400">Indian NAAQS ({naaqsLimit} µg/m³)</div>
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
export const BenchmarkComparison = memo(function BenchmarkComparison({ values, className = '' }: BenchmarkComparisonProps): ReactElement {
  return (
    <section
      aria-label="Health and Regulatory Benchmarks"
      className={`p-6 rounded-3xl bg-bento-canvas/50 dark:bg-neutral-800/40 ${className}`.trim()}
    >
      <details open className="group">
        <summary className="flex items-center justify-between cursor-pointer list-none focus:outline-none focus:ring-2 focus:ring-teal-600 rounded-lg py-1">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Compare with WHO and Indian standards
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Health &amp; Regulatory Benchmarks • 24-hour limits
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>

        <div className="mt-4 space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
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
      </details>
    </section>
  );
});
