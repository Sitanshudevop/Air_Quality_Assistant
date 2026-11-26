// Accessible AI provenance status badge with live announcements and retry control.
import type { ReactElement } from 'react';
import type { Provenance } from '../../../shared/types.js';

/** Props for ProvenanceBadge component. */
export interface ProvenanceBadgeProps {
  provenance: Provenance;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

function BadgePill({ provenance }: { provenance: Provenance }): ReactElement {
  const isGemini = provenance.source === 'gemini';
  const label = isGemini ? `Gemini live (${provenance.model})` : 'Rule-based mode';
  const toneClass = isGemini
    ? 'bg-sky-50 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-100 dark:border-sky-700'
    : 'bg-amber-50 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-700';
  const dotClass = isGemini ? 'bg-sky-600 dark:bg-sky-400' : 'bg-amber-600 dark:bg-amber-400';

  return (
    <span
      title={!isGemini ? provenance.reason : undefined}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${toneClass}`}
    >
      <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span>{label}</span>
      {!isGemini && provenance.reason && <span className="text-[11px] opacity-80">({provenance.reason})</span>}
      {provenance.cached && <span className="text-[11px] opacity-80">(cached)</span>}
    </span>
  );
}

/**
 * Displays AI generation provenance (Gemini live vs Rule-based mode), cache state, and retry action.
 *
 * @param props - Provenance metadata, optional retry callback, and loading state.
 * @returns React element with polite screen-reader announcement.
 */
export function ProvenanceBadge({
  provenance,
  onRetry,
  isRetrying = false,
  className = '',
}: ProvenanceBadgeProps): ReactElement {
  const showRetry = provenance.source !== 'gemini' && Boolean(onRetry);

  return (
    <div role="status" aria-live="polite" className={`inline-flex flex-wrap items-center gap-2 ${className}`.trim()}>
      <BadgePill provenance={provenance} />
      {showRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          aria-busy={isRetrying}
          className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border border-neutral-400 bg-white text-neutral-900 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-sky-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-700"
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      )}
    </div>
  );
}
