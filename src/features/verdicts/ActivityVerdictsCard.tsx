// Lifestyle activity safety recommendations card displaying Go / Wait / Avoid verdict pills.
import type { ReactElement } from 'react';
import type { AqiCategory, VulnerabilityGroup } from '../../domain/types.js';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';
import { evaluateActivityVerdicts, type ActivityVerdict, type ActivityVerdictItem } from '../../domain/activityVerdicts.js';

/** Props for ActivityVerdictsCard component. */
export interface ActivityVerdictsCardProps {
  readonly aqi?: number;
  readonly category?: AqiCategory;
  readonly vulnerability?: VulnerabilityGroup;
  readonly points?: readonly HourlyAirQualityPoint[];
  readonly className?: string;
}

function getVerdictBadgeClass(verdict: ActivityVerdict): string {
  switch (verdict) {
    case 'Go':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    case 'Wait':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    case 'Avoid':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800';
  }
}

function ActivityItem({ item }: { item: ActivityVerdictItem }): ReactElement {
  const badgeCls = getVerdictBadgeClass(item.verdict);

  return (
    <div className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 flex flex-col justify-between space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{item.title}</h4>
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeCls}`}>
          {item.verdict}
        </span>
      </div>

      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed flex-1">
        {item.reason}
      </p>

      {(item.safeWindow || item.maskRecommendation) && (
        <div className="pt-1.5 border-t border-neutral-200/60 dark:border-neutral-700/60 space-y-1 text-[11px]">
          {item.safeWindow && (
            <div className="text-teal-700 dark:text-teal-400 font-medium">
              🕒 {item.safeWindow}
            </div>
          )}
          {item.maskRecommendation && (
            <div className="text-neutral-600 dark:text-neutral-400">
              😷 <span className="font-semibold">{item.maskRecommendation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Evaluates and renders Go / Wait / Avoid verdicts across 7 routine daily activities.
 *
 * @param props - Current AQI, category, household vulnerability, and hourly forecast points.
 * @returns React component element or null when AQI is absent.
 */
export function ActivityVerdictsCard({
  aqi,
  vulnerability = 'healthy_adult',
  points,
  className = '',
}: ActivityVerdictsCardProps): ReactElement | null {
  if (aqi === undefined) return null;

  const verdicts = evaluateActivityVerdicts(aqi, vulnerability, points);

  return (
    <section
      aria-label="Daily Activity Verdicts"
      className={`p-5 rounded-[24px] border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Daily Activity Verdicts
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Evidence-backed Go / Wait / Avoid safety ratings tailored to your household
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" /> Go
          <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" aria-hidden="true" /> Wait
          <span className="w-2 h-2 rounded-full bg-rose-500 ml-1" aria-hidden="true" /> Avoid
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {verdicts.map((item) => (
          <ActivityItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
