// Single time-blocked daily routine item card with badges and expandable Why/Facts drawer.
import { useState, type ReactElement } from 'react';
import type { AqiCategory, RoutineItem } from '../../domain/types.js';
import { isOutdoorBlockLocked, TIME_BLOCK_META } from './routineUtils.js';

/** Props for RoutineItemCard component. */
export interface RoutineItemCardProps {
  readonly item: RoutineItem;
  readonly category: AqiCategory;
}

const EFFORT_STYLES: Readonly<Record<RoutineItem['effort'], string>> = {
  low: 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700',
  medium: 'bg-amber-50 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700',
  high: 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-700',
};

/**
 * Displays one time-blocked routine action, effort/cost badges, and an accessible rationale drawer.
 *
 * @param props - Routine item data and active AQI category.
 * @returns Accessible article card element.
 */
export function RoutineItemCard({ item, category }: RoutineItemCardProps): ReactElement {
  const [open, setOpen] = useState<boolean>(false);
  const meta = TIME_BLOCK_META[item.timeBlock];
  const locked = isOutdoorBlockLocked(category, item.timeBlock);
  const drawerId = `routine-drawer-${item.id}`;

  return (
    <article className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-sky-800 dark:text-sky-300">
            {meta.label}
          </span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">{meta.window}</span>
          {locked && (
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full border border-purple-400 bg-purple-50 text-purple-900 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-700">
              Outdoor Locked (Severe)
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
          <span className={`px-2 py-0.5 rounded-full border capitalize ${EFFORT_STYLES[item.effort]}`}>
            Effort: {item.effort}
          </span>
          <span className="px-2 py-0.5 rounded-full border border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 capitalize">
            Cost: {item.costBand}
          </span>
        </div>
      </div>

      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.action}</p>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          Impact: {item.impactEstimate}
        </span>

        <button
          type="button"
          aria-expanded={open}
          aria-controls={drawerId}
          onClick={() => setOpen((prev) => !prev)}
          className="text-xs font-semibold min-h-[44px] sm:min-h-0 inline-flex items-center text-sky-700 dark:text-sky-400 underline focus:outline-none focus:ring-2 focus:ring-sky-500 rounded px-2 py-0.5"
        >
          {open ? 'Hide Why & Facts' : 'Why & Facts'}
        </button>
      </div>

      {open && (
        <div
          id={drawerId}
          className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 text-xs space-y-1.5"
        >
          <p className="text-neutral-800 dark:text-neutral-200">
            <strong>Rationale:</strong> {item.why}
          </p>
          <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-0.5">
            {item.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
            Codes: {item.reasonCodes.join(', ')}
          </p>
        </div>
      )}
    </article>
  );
}
