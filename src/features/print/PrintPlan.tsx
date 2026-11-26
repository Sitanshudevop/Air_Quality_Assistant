// Print-friendly family emergency smog plan layout with emergency contacts and citations.
import type { ReactElement } from 'react';
import type { AqiCategory, RoutineItem } from '../../domain/types.js';
import { PrintButton } from '../../components/PrintButton.js';
import { TIME_BLOCK_META } from '../routine/routineUtils.js';

/** Props for PrintPlan component. */
export interface PrintPlanProps {
  readonly cityName?: string;
  readonly aqi?: number;
  readonly category?: AqiCategory;
  readonly routineItems: readonly RoutineItem[];
}

/**
 * Printable family smog emergency summary with 112/102 contacts and expanded citations.
 *
 * @param props - Active city, AQI category, and deterministic routine items.
 * @returns Print-ready summary section or null if air quality data is absent.
 */
export function PrintPlan({
  cityName,
  aqi,
  category,
  routineItems,
}: PrintPlanProps): ReactElement | null {
  if (aqi === undefined || !category || !cityName) {
    return null;
  }

  const topActions = routineItems.slice(0, 4);

  return (
    <section
      aria-labelledby="print-plan-heading"
      className="print-card p-6 rounded-3xl bg-bento-canvas/50 dark:bg-neutral-800/40 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="print-plan-heading" className="text-base font-bold">
            Family Smog Emergency Plan — {cityName}
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Estimated CPCB AQI: {aqi} ({category})
          </p>
        </div>
        <PrintButton label="Print Family Smog Plan" />
      </div>

      <div className="print-emergency p-3.5 rounded-2xl bg-bento-blush dark:bg-rose-950/30 text-bento-ink dark:text-rose-200 text-xs">
        <strong>Emergency Medical Contacts:</strong> National Emergency 112 | Ambulance 102. Seek
        urgent hospital care for severe breathlessness, chest pain, or cyanosis.
      </div>

      {topActions.length > 0 && (
        <ul className="list-disc list-inside text-xs space-y-1 text-neutral-700 dark:text-neutral-300">
          {topActions.map((item) => (
            <li key={item.id}>
              <strong>{TIME_BLOCK_META[item.timeBlock]?.label ?? item.timeBlock}:</strong> {item.action}
            </li>
          ))}
        </ul>
      )}

      <div className="text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
        <p>
          Reference Standards:{' '}
          <a
            href="https://cpcb.nic.in"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-sky-700 dark:text-sky-400"
          >
            CPCB India NAAQS
          </a>{' '}
          |{' '}
          <a
            href="https://www.who.int/publications/i/item/9789240034228"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-sky-700 dark:text-sky-400"
          >
            WHO 2021 Air Quality Guidelines
          </a>
        </p>
        <p>Informational guidance only; not medical advice.</p>
      </div>
    </section>
  );
}
