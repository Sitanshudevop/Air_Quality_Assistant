// Accessible WAI-ARIA top-level feature tablist supporting keyboard navigation and Hindi labels.
import type { KeyboardEvent, ReactElement } from 'react';
import { useLanguage } from '../../state/language.js';

/** Top-level application tab identifiers. */
export type FeatureTabId = 'today' | 'routine' | 'indoor' | 'impact' | 'assistant' | 'community';

/** Tab metadata connecting ID with translation key. */
export const FEATURE_TABS: ReadonlyArray<{ readonly id: FeatureTabId; readonly labelKey: string }> = [
  { id: 'today', labelKey: 'nav.today' },
  { id: 'routine', labelKey: 'nav.routine' },
  { id: 'indoor', labelKey: 'nav.indoor' },
  { id: 'impact', labelKey: 'nav.impact' },
  { id: 'assistant', labelKey: 'nav.assistant' },
  { id: 'community', labelKey: 'nav.community' },
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
 * Accessible horizontal navigation tabs for Today and Milestone M5 feature views.
 *
 * @param props - Active tab identifier and selection callback.
 * @returns WAI-ARIA tablist navigation element.
 */
export function FeatureTabs({ activeTab, onSelectTab }: FeatureTabsProps): ReactElement {
  const { t, language } = useLanguage();

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
            lang={language === 'hi' ? 'hi' : undefined}
            onClick={() => onSelectTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
              selected
                ? 'bg-sky-700 text-white border-sky-700 dark:bg-sky-500 dark:text-neutral-950'
                : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-800'
            }`}
          >
            {t(tab.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
