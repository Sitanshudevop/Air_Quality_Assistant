// Accessible WAI-ARIA top-level feature tablist supporting keyboard navigation.
import type { KeyboardEvent, ReactElement } from 'react';

/** Top-level application tab identifiers. */
export type FeatureTabId = 'today' | 'routine' | 'indoor' | 'impact' | 'assistant' | 'community';

/** Tab metadata connecting ID with display label. */
export const FEATURE_TABS: ReadonlyArray<{ readonly id: FeatureTabId; readonly label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'routine', label: 'Daily Routine' },
  { id: 'indoor', label: 'Indoor Hacks' },
  { id: 'impact', label: 'Impact Explainer' },
  { id: 'assistant', label: 'Assistant' },
  { id: 'community', label: 'Community Kit' },
];

/** Props for FeatureTabs component. */
export interface FeatureTabsProps {
  readonly activeTab: FeatureTabId;
  readonly onSelectTab: (tab: FeatureTabId) => void;
}

function resolveNextTab(key: string, idx: number): FeatureTabId | null {
  const count = FEATURE_TABS.length;
  const map: Record<string, number> = {
    ArrowRight: (idx + 1) % count,
    ArrowLeft: (idx - 1 + count) % count,
    Home: 0,
    End: count - 1,
  };
  const next = map[key];
  return next !== undefined ? FEATURE_TABS[next].id : null;
}

/**
 * Accessible horizontal navigation tabs for Today and feature views.
 *
 * @param props - Active tab identifier and selection callback.
 * @returns WAI-ARIA tablist navigation element.
 */
export function FeatureTabs({ activeTab, onSelectTab }: FeatureTabsProps): ReactElement {
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number): void => {
    const nextId = resolveNextTab(e.key, idx);
    if (nextId) {
      e.preventDefault();
      onSelectTab(nextId);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Feature views"
      className="no-print flex flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3"
    >
      {FEATURE_TABS.map((tab, idx) => {
        const selected = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={selected ? `tabpanel-${tab.id}` : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelectTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`px-3 py-2 min-h-[44px] sm:min-h-0 text-xs font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
              selected
                ? 'bg-sky-700 text-white border-sky-700 dark:bg-sky-500 dark:text-neutral-950'
                : 'bg-white text-neutral-800 border-slate-400 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-600 dark:hover:bg-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
