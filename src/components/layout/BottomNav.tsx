// Mobile bottom navigation bar with accessible Lucide icons, labels, and >= 44px touch targets.
import type { ReactElement } from 'react';
import { Home, Clock, Leaf, Scale, MessageCircle, Users } from 'lucide-react';
import type { FeatureTabId } from './FeatureTabs.js';

/** Props for BottomNav component. */
export interface BottomNavProps {
  readonly activeTab: FeatureTabId;
  readonly onSelectTab: (tab: FeatureTabId) => void;
  readonly className?: string;
}

interface BottomNavMeta {
  readonly id: FeatureTabId;
  readonly icon: ReactElement;
  readonly label: string;
}

const NAV_ITEMS: readonly BottomNavMeta[] = [
  { id: 'today', icon: <Home size={18} />, label: 'Today' },
  { id: 'routine', icon: <Clock size={18} />, label: 'Routine' },
  { id: 'indoor', icon: <Leaf size={18} />, label: 'Indoor' },
  { id: 'impact', icon: <Scale size={18} />, label: 'Impact' },
  { id: 'assistant', icon: <MessageCircle size={18} />, label: 'Assistant' },
  { id: 'community', icon: <Users size={18} />, label: 'Community' },
];

/**
 * Mobile-only fixed bottom navigation bar supporting >= 44px touch targets and safe-area inset.
 *
 * @param props - Current tab and tab switch handler.
 * @returns React component element visible on < 768px screens.
 */
export function BottomNav({ activeTab, onSelectTab, className = '' }: BottomNavProps): ReactElement {
  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className={`md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-slate-100 dark:border-neutral-800 px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-lg ${className}`.trim()}
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
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] py-1 px-1 rounded-xl text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-bento-ink dark:text-white font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span className="truncate max-w-[50px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
