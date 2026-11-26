// Mobile bottom navigation bar with accessible icons, labels, and >= 44px touch targets.
import type { ReactElement } from 'react';
import type { FeatureTabId } from './FeatureTabs.js';
import { useLanguage } from '../../state/language.js';

/** Props for BottomNav component. */
export interface BottomNavProps {
  readonly activeTab: FeatureTabId;
  readonly onSelectTab: (tab: FeatureTabId) => void;
  readonly className?: string;
}

interface BottomNavMeta {
  readonly id: FeatureTabId;
  readonly icon: string;
  readonly label: string;
}

const NAV_ITEMS: readonly BottomNavMeta[] = [
  { id: 'today', icon: '🏠', label: 'Today' },
  { id: 'routine', icon: '⏱️', label: 'Routine' },
  { id: 'indoor', icon: '🌿', label: 'Indoor' },
  { id: 'impact', icon: '⚖️', label: 'Impact' },
  { id: 'assistant', icon: '💬', label: 'Assistant' },
  { id: 'community', icon: '👥', label: 'Community' },
];

/**
 * Mobile-specific sticky bottom navigation bar supporting thumb targets >= 44px.
 *
 * @param props - Current tab and tab switch handler.
 * @returns React component element visible only on small screens.
 */
export function BottomNav({ activeTab, onSelectTab, className = '' }: BottomNavProps): ReactElement {
  const { language } = useLanguage();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className={`md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 z-40 px-2 py-1 shadow-lg ${className}`.trim()}
    >
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              lang={language === 'hi' ? 'hi' : undefined}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] py-1 px-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-teal-800 dark:text-teal-400 font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              <span className="text-base" aria-hidden="true">{item.icon}</span>
              <span className="truncate max-w-[54px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
