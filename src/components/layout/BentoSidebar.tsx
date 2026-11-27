// Stationary vertical sidebar that smoothly expands on hover to reveal labels with zero layout shift.
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

const LABEL_CLS =
  'text-sm font-medium whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-all duration-200';

function NavItem(props: { tab: FeatureTabId; isActive: boolean; onSelect: () => void }): ReactElement {
  const iconCls = props.isActive
    ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-ink'
    : 'text-neutral-500 group-hover/btn:text-bento-ink group-hover/btn:bg-neutral-100 dark:text-neutral-400 dark:group-hover/btn:text-white dark:group-hover/btn:bg-neutral-800';

  return (
    <button
      type="button"
      onClick={props.onSelect}
      aria-current={props.isActive ? 'page' : undefined}
      aria-label={TAB_LABELS[props.tab]}
      title={TAB_LABELS[props.tab]}
      className="group/btn flex items-center gap-3 w-full rounded-2xl text-left hover:bg-slate-100/80 dark:hover:bg-neutral-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-bento-ink/30"
    >
      <span className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl transition-colors ${iconCls}`}>
        {TAB_ICONS[props.tab]}
      </span>
      <span className={`${LABEL_CLS} ${props.isActive ? 'font-bold text-bento-ink dark:text-white' : 'text-slate-700 dark:text-neutral-300'}`}>
        {TAB_LABELS[props.tab]}
      </span>
    </button>
  );
}

function UtilButton(props: { icon: ReactElement; label: string; ariaLabel: string; onClick: () => void }): ReactElement {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={props.ariaLabel}
      title={props.label}
      className="flex items-center gap-3 w-full rounded-2xl text-left text-neutral-500 hover:text-bento-ink hover:bg-slate-100/80 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-bento-ink/30"
    >
      <span className="w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl">{props.icon}</span>
      <span className={LABEL_CLS}>{props.label}</span>
    </button>
  );
}

/**
 * Fixed-slot desktop sidebar that floats wider on hover to reveal navigation and utility labels.
 *
 * @param props - Active tab, theme, language, and modal callbacks.
 * @returns React element.
 */
export function BentoSidebar({
  activeTab, onSelectTab, isDark, onToggleTheme, onToggleLang, onOpenTour, onOpenProfile,
}: BentoSidebarProps): ReactElement {
  return (
    <div className="hidden md:block w-16 shrink-0 sticky top-4 h-[calc(100dvh-2rem)] z-40">
      <aside
        aria-label="Sidebar navigation"
        className="group absolute inset-y-0 left-0 w-16 hover:w-56 focus-within:w-56 bg-white dark:bg-neutral-900 rounded-3xl py-4 px-3 flex flex-col justify-between shadow-sm hover:shadow-xl focus-within:shadow-xl border border-slate-100/80 dark:border-neutral-800 transition-all duration-200 ease-out overflow-hidden"
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3 w-full mb-3">
            <SaansLogo className="w-10 h-10" />
            <span className={`${LABEL_CLS} text-base font-extrabold text-bento-ink dark:text-white`}>
              Saans
            </span>
          </div>
          {FEATURE_TABS.map((tab) => (
            <NavItem key={tab.id} tab={tab.id} isActive={tab.id === activeTab} onSelect={() => onSelectTab(tab.id)} />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <UtilButton icon={<Languages size={18} />} label="हिंदी / English" ariaLabel="Switch language" onClick={onToggleLang} />
          <UtilButton icon={isDark ? <Sun size={18} /> : <Moon size={18} />} label={isDark ? 'Light Mode' : 'Dark Mode'} ariaLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={onToggleTheme} />
          <UtilButton icon={<Compass size={18} />} label="Guided Tour" ariaLabel="Tour" onClick={onOpenTour} />
          <UtilButton icon={<UserCircle size={18} />} label="Family Profile" ariaLabel="Profile" onClick={onOpenProfile} />
        </div>
      </aside>
    </div>
  );
}
