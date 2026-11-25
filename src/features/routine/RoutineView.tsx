// Time-blocked daily low-emission routine view driven by domain engine and AI narration.
import { useMemo, type ReactElement } from 'react';
import { generateRoutine } from '../../domain/routine.js';
import type { AqiCategory, RoutineItem } from '../../domain/types.js';
import type { StoredProfile } from '../../services/profile.types.js';
import type { NarratePlanResult } from '../../../shared/types.js';
import { useAiTask } from '../../hooks/useAiTask.js';
import { useLanguage } from '../../state/language.js';
import { RoutineItemCard } from './RoutineItemCard.js';
import { RoutineNarrativeCard } from './RoutineNarrativeCard.js';
import { buildRoutineFacts, mapStoredProfileToDomain } from './routineUtils.js';

/** Props for RoutineView component. */
export interface RoutineViewProps {
  readonly aqi: number;
  readonly category: AqiCategory;
  readonly cityName: string;
  readonly profile?: Partial<StoredProfile>;
  readonly itemsOverride?: readonly RoutineItem[];
}

/**
 * Interactive 8-period daily routine schedule with Severe lockdown banner and AI narration.
 *
 * @param props - Current air quality, city, household profile, and optional items override.
 * @returns Accessible section element for Daily Routine tab.
 */
export function RoutineView({
  aqi,
  category,
  cityName,
  profile,
  itemsOverride,
}: RoutineViewProps): ReactElement {
  const { t, language } = useLanguage();
  const domainProfile = useMemo(() => mapStoredProfileToDomain(profile), [profile]);
  const items = useMemo(
    () => itemsOverride ?? generateRoutine(category, domainProfile),
    [itemsOverride, category, domainProfile]
  );
  const facts = useMemo(() => buildRoutineFacts(aqi, category, items), [aqi, category, items]);

  const ai = useAiTask<NarratePlanResult>({
    task: 'narrate-plan',
    context: { aqi: Math.round(aqi), city: cityName, facts },
  });

  return (
    <section aria-labelledby="routine-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="routine-heading" lang={language === 'hi' ? 'hi' : undefined} className="text-lg font-bold">
            {t('routine.title')}
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            8 diurnal blocks calibrated for {cityName} ({category}, Est. AQI {aqi})
          </p>
        </div>
      </div>

      {category === 'Severe' && (
        <div
          role="alert"
          className="p-3 rounded-lg border border-purple-400 bg-purple-50 text-purple-950 dark:bg-purple-950/60 dark:text-purple-100 dark:border-purple-700 text-xs font-medium"
        >
          Severe Smog Emergency: Outdoor exercise, midday airing, and school outdoor activities are locked. Stay indoors with filtration.
        </div>
      )}

      <RoutineNarrativeCard
        cityName={cityName}
        aqi={aqi}
        category={category}
        items={items}
        data={ai.data}
        provenance={ai.provenance}
        isLoading={ai.isLoading}
        error={ai.error}
        onGenerate={() => void ai.trigger()}
      />

      {items.length === 0 ? (
        <p className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-600 dark:text-neutral-400">
          No routine actions available for the current configuration.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <RoutineItemCard key={item.id} item={item} category={category} />
          ))}
        </div>
      )}
    </section>
  );
}
