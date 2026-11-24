// Accessible application footer with citations and health disclaimers.
import type { ReactElement } from 'react';

/**
 * Renders the application footer with data attribution, scientific citations, and health disclaimers.
 *
 * @returns React component element.
 */
export function AppFooter(): ReactElement {
  return (
    <footer
      role="contentinfo"
      className="max-w-5xl mx-auto mt-12 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 space-y-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>Data: Open-Meteo Air Quality &amp; Weather APIs | CPCB AQI Breakpoints (2014) | WHO 2021</p>
        <p>&copy; {new Date().getFullYear()} Saans. PromptWars Showcase.</p>
      </div>
      <p className="italic text-[11px] text-neutral-400 dark:text-neutral-500">
        Disclaimer: Saans provides instantaneous estimates and scientific exposure reduction guidance;
        not intended as clinical or medical advice.
      </p>
    </footer>
  );
}
