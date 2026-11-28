// Side-by-side comparison card displaying % exposure delta, uncertainty bar, CO2e, and assumptions.
import { useState, type ReactElement } from 'react';
import { EXPOSURE_DISCLAIMER } from '../../domain/exposure.js';
import type { AlternativeComparisonResult } from '../../domain/types.js';

/** Props for ComparisonCard component. */
export interface ComparisonCardProps {
  readonly result: AlternativeComparisonResult;
  readonly maxHighDoseUg: number;
  readonly isBaseline?: boolean;
}

/**
 * Renders one scenario comparison card with uncertainty range bar and explainability drawer.
 *
 * @param props - Scenario comparison metrics, chart scale max, and baseline flag.
 * @returns Accessible card article element.
 */
export function ComparisonCard({
  result,
  maxHighDoseUg,
  isBaseline = false,
}: ComparisonCardProps): ReactElement {
  const [open, setOpen] = useState<boolean>(false);
  const [lowUg, highUg] = result.doseUncertaintyRangeUg;
  const scaleMax = Math.max(1, maxHighDoseUg);
  const leftPct = Math.min(100, Math.round((lowUg / scaleMax) * 100));
  const widthPct = Math.max(4, Math.min(100 - leftPct, Math.round(((highUg - lowUg) / scaleMax) * 100)));
  const deltaSign = result.relativeDoseChangePct > 0 ? '+' : '';
  const co2Sign = result.co2eDeltaGrams > 0 ? '+' : '';
  const drawerId = `impact-explain-${result.choiceId}`;

  return (
    <article className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 space-y-3 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 break-words">
            {result.title}
          </h3>
          {isBaseline && (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded bg-neutral-200 dark:bg-neutral-800">
              Baseline
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-xl font-extrabold text-sky-800 dark:text-sky-300">
            {deltaSign}{result.relativeDoseChangePct}%
          </span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            exposure change ({result.inhaledDoseUg} µg PM2.5)
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
            <span>Uncertainty range</span>
            <span>{lowUg}–{highUg} µg</span>
          </div>
          <div
            role="img"
            aria-label={`Uncertainty range from ${lowUg} to ${highUg} micrograms`}
            className="relative h-2.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden"
          >
            <div
              className="absolute top-0 bottom-0 rounded-full bg-sky-600 dark:bg-sky-400"
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            />
          </div>
        </div>

        <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
          CO₂e per trip: {result.co2eGrams}g ({co2Sign}{result.co2eDeltaGrams}g vs baseline)
        </p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">{result.summary}</p>
      </div>

      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={drawerId}
          onClick={() => setOpen((prev) => !prev)}
          className="text-xs font-semibold min-h-[44px] sm:min-h-0 inline-flex items-center text-sky-700 dark:text-sky-400 underline focus:outline-none focus:ring-2 focus:ring-sky-500 rounded px-1 py-0.5"
        >
          {open ? 'Hide Breakdown' : 'Explainability Breakdown'}
        </button>

        {open && (
          <div id={drawerId} className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-[11px] text-neutral-700 dark:text-neutral-300 space-y-1">
            <p>Factors: mode infiltration, minute ventilation, mask filtration efficiency, and trip duration.</p>
            <p className="font-medium">{EXPOSURE_DISCLAIMER}</p>
          </div>
        )}
      </div>
    </article>
  );
}
