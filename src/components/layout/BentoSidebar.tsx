// Slim left icon sidebar pinned to viewport height with top nav icons and bottom utility controls.
import type { ReactElement } from 'react';
import {
  Home, Clock, Leaf, Scale, MessageCircle, Users,
  Sun, Moon, Languages, Compass, UserCircle,
} from 'lucide-react';
import type { FeatureTabId } from './FeatureTabs.js';
import { FEATURE_TABS } from './FeatureTabs.js';
import { SaansLogo } from '../ui/SaansLogo.js';

/** Props for BentoSidebar component. */
export interface BentoSidebarProps {
  readonly activeTab: FeatureTabId;
  readonly onSelectTab: (tab: FeatureTabId) => void;
  readonly isDark: boolean;
  readonly onToggleTheme: () => void;
  readonly onToggleLang: () => void;
  readonly onOpenTour: () => void;
  readonly onOpenProfile: () => void;
}

const TAB_ICONS: Record<FeatureTabId, ReactElement> = {
  today: <Home size={20} />,
  routine: <Clock size={20} />,
  indoor: <Leaf size={20} />,
  impact: <Scale size={20} />,
  assistant: <MessageCircle size={20} />,
  community: <Users size={20} />,
};

const TAB_LABELS: Record<FeatureTabId, string> = {
  today: 'Today',
  routine: 'Daily Routine',
  indoor: 'Indoor Hacks',
  impact: 'Impact Explainer',
  assistant: 'Assistant',
  community: 'Community Kit',
};

function NavIcon(props: { tab: FeatureTabId; isActive: boolean; onSelect: () => void }): ReactElement {
  return (
    <button
      type="button"
      onClick={props.onSelect}
      aria-current={props.isActive ? 'page' : undefined}
      aria-label={TAB_LABELS[props.tab]}
      title={TAB_LABELS[props.tab]}
      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-bento-ink/30 ${
        props.isActive
          ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-ink'
          : 'text-neutral-500 hover:text-bento-ink hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
      }`}
    >
      {TAB_ICONS[props.tab]}
    </button>
  );
}

/**
 * Narrow icon rail sidebar pinned to viewport height (desktop only).
 *
 * @param props - Active tab, theme, language, and modal callbacks.
 * @returns React element.
 */
export function BentoSidebar({
  activeTab, onSelectTab, isDark, onToggleTheme, onToggleLang, onOpenTour, onOpenProfile,
}: BentoSidebarProps): ReactElement {
  const utilCls = 'w-10 h-10 flex items-center justify-center rounded-xl text-neutral-400 hover:text-bento-ink hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-bento-ink/30';

  return (
    <aside
      aria-label="Sidebar navigation"
      className="hidden md:flex sticky top-4 h-[calc(100dvh-2rem)] self-start flex-col justify-between w-16 bg-white dark:bg-neutral-900 rounded-3xl py-5 shadow-sm shrink-0"
    >
      <div className="flex flex-col items-center gap-1.5">
        <SaansLogo className="mb-3" />
        {FEATURE_TABS.map((tab) => (
          <NavIcon
            key={tab.id}
            tab={tab.id}
            isActive={tab.id === activeTab}
            onSelect={() => onSelectTab(tab.id)}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-1">
        <button type="button" onClick={onToggleLang} aria-label="Switch language" title="Switch language" className={utilCls}>
          <Languages size={18} />
        </button>
        <button type="button" onClick={onToggleTheme} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'} className={utilCls}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button type="button" onClick={onOpenTour} aria-label="Tour" title="Guided Tour" className={utilCls}>
          <Compass size={18} />
        </button>
        <button type="button" onClick={onOpenProfile} aria-label="Profile" title="Family Profile" className={utilCls}>
          <UserCircle size={18} />
        </button>
      </div>
    </aside>
  );
}
