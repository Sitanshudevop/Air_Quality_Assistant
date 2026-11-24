// Persistent top banner displaying demo mode attribution.
import type { ReactElement } from 'react';
import { DEMO_BANNER_TEXT } from '../../state/mode.js';

/** Props for DemoBanner component. */
export interface DemoBannerProps {
  isDemo: boolean;
}

/**
 * Renders an accessible notification banner when operating in demo snapshot mode.
 *
 * @param props - Visibility state.
 * @returns React component element or null.
 */
export function DemoBanner({ isDemo }: DemoBannerProps): ReactElement | null {
  if (!isDemo) return null;

  return (
    <aside
      role="status"
      aria-label="Demo mode indicator"
      className="w-full bg-amber-400 dark:bg-amber-500 text-neutral-950 font-semibold text-xs py-2 px-4 text-center shadow-sm"
    >
      {DEMO_BANNER_TEXT}
    </aside>
  );
}
