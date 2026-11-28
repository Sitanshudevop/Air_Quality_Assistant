// Interactive myth-busting flip/reveal cards backed by scientific citations.
import { useState, type ReactElement } from 'react';
import { INDOOR_MYTHS } from '../../domain/indoor.js';
import { MYTH_CITATION_URLS } from './indoorData.js';

/**
 * Renders peer-reviewed indoor air quality myth-busting cards with citations and safe external links.
 *
 * @returns Grid of interactive myth reveal cards.
 */
export function MythBusterCards(): ReactElement {
  const [revealedIndex, setRevealedIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
        Indoor Air Myth Busting (Peer-Reviewed)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {INDOOR_MYTHS.map((item, idx) => {
          const isOpen = revealedIndex === idx;
          const panelId = `myth-panel-${idx}`;
          const citationUrl = MYTH_CITATION_URLS[idx] ?? 'https://www.epa.gov/indoor-air-quality-iaq';

          return (
            <div
              key={item.myth}
              className="p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 space-y-2"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setRevealedIndex(isOpen ? null : idx)}
                className="w-full min-h-[44px] sm:min-h-0 flex items-center text-left text-xs font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded p-0.5"
              >
                Myth: {item.myth}
              </button>

              {isOpen && (
                <div id={panelId} className="text-xs text-neutral-700 dark:text-neutral-300 space-y-1 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                  <p>{item.reality}</p>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                    Citation: {item.citation}{' '}
                    <a
                      href={citationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center min-h-[44px] sm:min-h-0 px-1 underline text-sky-700 dark:text-sky-400"
                    >
                      Source
                    </a>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
