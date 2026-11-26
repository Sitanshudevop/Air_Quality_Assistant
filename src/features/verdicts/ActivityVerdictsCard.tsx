// Lifestyle activity safety recommendations card displaying Go / Wait / Avoid pastel Bento cells.
import type { ReactElement } from 'react';
import { Clock3, ShieldAlert } from 'lucide-react';
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

function getVerdictCardClass(verdict: ActivityVerdict): string {
  switch (verdict) {
    case 'Go':
      return 'bg-bento-mint/75 dark:bg-emerald-950/40';
    case 'Wait':
      return 'bg-amber-50 dark:bg-amber-950/40';
    case 'Avoid':
      return 'bg-bento-blush/75 dark:bg-rose-950/40';
  }
}

function getVerdictBadgeClass(verdict: ActivityVerdict): string {
  switch (verdict) {
    case 'Go':
      return 'bg-emerald-700 text-white dark:bg-emerald-600';
    case 'Wait':
      return 'bg-amber-600 text-white dark:bg-amber-500';
    case 'Avoid':
      return 'bg-bento-ink text-white dark:bg-rose-600';
  }
}

function ActivityItem({ item }: { item: ActivityVerdictItem }): ReactElement {
  const badgeCls = getVerdictBadgeClass(item.verdict);
  const cardCls = getVerdictCardClass(item.verdict);

  return (
    <div className={`p-4 rounded-2xl ${cardCls} flex flex-col justify-between space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-bento-ink dark:text-neutral-100">{item.title}</h4>
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badgeCls}`}>
          {item.verdict}
        </span>
      </div>

      <p className="text-xs text-bento-ink/80 dark:text-neutral-300 leading-relaxed flex-1 break-words">
        {item.reason}
      </p>

      {(item.safeWindow || item.maskRecommendation) && (
        <div className="pt-2 space-y-1 text-[11px]">
          {item.safeWindow && (
            <div className="flex items-center gap-1.5 text-teal-800 dark:text-teal-300 font-semibold">
              <Clock3 size={12} aria-hidden="true" />
              <span>{item.safeWindow}</span>
            </div>
          )}
          {item.maskRecommendation && (
            <div className="flex items-center gap-1.5 text-bento-ink/75 dark:text-neutral-300">
              <ShieldAlert size={12} aria-hidden="true" />
              <span className="font-semibold">{item.maskRecommendation}</span>
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
      className={`p-6 rounded-3xl bg-bento-canvas/50 dark:bg-neutral-800/40 space-y-4 ${className}`.trim()}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
        {verdicts.map((item) => (
          <ActivityItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
