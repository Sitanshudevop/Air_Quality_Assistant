// Accessible skip-to-content landmark bypass link.
import type { ReactElement } from 'react';

/** Props for SkipLink component. */
export interface SkipLinkProps {
  targetId?: string;
  label?: string;
}

/**
 * Renders an accessible keyboard bypass link that jumps directly to main content.
 *
 * @param props - Target anchor id and customizable link label.
 * @returns React component element.
 */
export function SkipLink({
  targetId = '#main-content',
  label = 'Skip to main content',
}: SkipLinkProps): ReactElement {
  return (
    <a
      href={targetId}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-md focus:bg-sky-700 focus:text-white focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
    >
      {label}
    </a>
  );
}
