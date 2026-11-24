// Accessible Badge component for AI provenance and status indication.
import type { ReactElement } from 'react';
import type { Provenance } from '../../../shared/types.js';

/** Props for Badge component. */
export interface BadgeProps {
  provenance: Provenance;
  className?: string;
}

/**
 * Renders an AI provenance badge displaying generation source and model.
 *
 * @param props - Provenance details and optional styling.
 * @returns React component element.
 */
export function Badge({ provenance, className = '' }: BadgeProps): ReactElement {
  const isAi = provenance.source === 'gemini';
  const label = isAi ? `AI (${provenance.model})` : 'Rule-based';
  const bgClass = isAi
    ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800'
    : 'bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';

  return (
    <span
      role="status"
      aria-label={`Generated via ${label}${provenance.cached ? ' (cached)' : ''}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bgClass} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`w-1.5 h-1.5 rounded-full ${isAi ? 'bg-sky-500' : 'bg-neutral-400'}`}
      />
      <span>{label}</span>
      {provenance.cached ? (
        <span className="text-[10px] opacity-75" aria-hidden="true">
          (cached)
        </span>
      ) : null}
    </span>
  );
}
