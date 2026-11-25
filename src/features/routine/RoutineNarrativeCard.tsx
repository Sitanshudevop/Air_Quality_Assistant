// AI plan narrative summary card with ProvenanceBadge and deterministic fallback.
import type { ReactElement } from 'react';
import type { AqiCategory, RoutineItem } from '../../domain/types.js';
import type { NarratePlanResult, Provenance } from '../../../shared/types.js';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge.js';
import { Button } from '../../components/ui/Button.js';

/** Props for RoutineNarrativeCard component. */
export interface RoutineNarrativeCardProps {
  readonly cityName: string;
  readonly aqi: number;
  readonly category: AqiCategory;
  readonly items: readonly RoutineItem[];
  readonly data: NarratePlanResult | null;
  readonly provenance: Provenance;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onGenerate: () => void;
}

/**
 * Displays grounded AI routine narration or deterministic fallback summary with provenance.
 *
 * @param props - Active conditions, routine items, AI state, and trigger handler.
 * @returns Narrative summary card element.
 */
export function RoutineNarrativeCard({
  cityName,
  aqi,
  category,
  items,
  data,
  provenance,
  isLoading,
  error,
  onGenerate,
}: RoutineNarrativeCardProps): ReactElement {
  const fallbackNarrative = `Daily low-emission schedule for ${cityName} (${category}, estimated AQI ${aqi}). Prioritize indoor air protection and low-exposure transit.`;
  const narrative = data?.narrative ?? fallbackNarrative;
  const recommendations = data?.recommendations ?? items.slice(0, 3).map((item) => item.action);

  return (
    <div
      aria-live="polite"
      aria-busy={isLoading}
      className="p-4 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/30 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
          Daily Plan Summary
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <ProvenanceBadge provenance={provenance} onRetry={onGenerate} isRetrying={isLoading} />
          <Button variant="outline" size="sm" onClick={onGenerate} disabled={isLoading}>
            {isLoading ? 'Summarizing...' : 'AI Narrate Plan'}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">
          {error}
        </p>
      )}

      <p className="text-sm text-neutral-800 dark:text-neutral-200">{narrative}</p>

      {recommendations.length > 0 && (
        <ul className="list-disc list-inside text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
          {recommendations.map((rec) => (
            <li key={rec}>{rec}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
