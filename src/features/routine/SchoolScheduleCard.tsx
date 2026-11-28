// School-day schedule precautions card covering assembly, transit, sports, and pickup.
import type { ReactElement } from 'react';
import { evaluateSchoolPrecautions, type SchoolPrecaution } from '../../domain/schoolSchedule.js';

/** Props for SchoolScheduleCard component. */
export interface SchoolScheduleCardProps {
  readonly aqi: number;
  readonly isEnabled: boolean;
  readonly onToggle: () => void;
  readonly className?: string;
}

function getVerdictBadgeClass(verdict: string): string {
  if (verdict === 'Suspended') {
    return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800';
  }
  if (verdict === 'Modified') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
  }
  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
}

function PrecautionItem({ item }: { item: SchoolPrecaution }): ReactElement {
  const badgeCls = getVerdictBadgeClass(item.verdict);

  return (
    <div className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-neutral-900 dark:text-neutral-100">{item.label}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeCls}`}>
          {item.verdict}
        </span>
      </div>
      <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
        {item.title}
      </div>
      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
        {item.advice}
      </p>
      {item.maskRequired && (
        <div className="text-[11px] text-teal-700 dark:text-teal-400 font-medium pt-0.5">
          😷 Child N95 / KF94 respirator advised
        </div>
      )}
    </div>
  );
}

/**
 * Interactive school-day schedule module evaluating assembly, transit, sports, and pickup protocols.
 *
 * @param props - Active AQI, toggle state, and toggle interaction handler.
 * @returns React component element.
 */
export function SchoolScheduleCard({
  aqi,
  isEnabled,
  onToggle,
  className = '',
}: SchoolScheduleCardProps): ReactElement {
  const precautions = evaluateSchoolPrecautions(aqi);

  return (
    <div className={`p-5 rounded-[24px] border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4 ${className}`.trim()}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            School-Day Schedule Mode
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Protocols for morning assembly, sports periods, bus transit, and gate pickup
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={onToggle}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 min-h-[44px] sm:min-h-0 rounded-full text-xs font-semibold border transition-colors ${
            isEnabled
              ? 'bg-teal-700 text-white border-teal-800 shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
          }`}
        >
          <span>🎒 School-day schedule</span>
          <span className="text-[10px] uppercase font-bold tracking-wider">{isEnabled ? 'Active' : 'Off'}</span>
        </button>
      </div>

      {isEnabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {precautions.map((p) => (
            <PrecautionItem key={p.id} item={p} />
          ))}
        </div>
      )}
    </div>
  );
}
