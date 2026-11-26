// Application header landmark with brand, navigation, segmented mode/lang toggles, profile, and More menu.
import type { ReactElement } from 'react';
import type { OperatingMode } from '../../state/mode.js';
import { useLanguage } from '../../state/language.js';
import { LanguageToggle } from '../LanguageToggle.js';
import { HeaderMoreMenu } from './HeaderMoreMenu.js';
import { FEATURE_TABS, type FeatureTabId } from './FeatureTabs.js';

/** Props for AppHeader component. */
export interface AppHeaderProps {
  mode: OperatingMode;
  onToggleMode: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenTour: () => void;
  onOpenProfile: () => void;
  activeTab?: FeatureTabId;
  onSelectTab?: (tab: FeatureTabId) => void;
}

function NavLinks(props: { activeTab?: FeatureTabId; onSelectTab?: (tab: FeatureTabId) => void }): ReactElement {
  const { t } = useLanguage();
  return (
    <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1">
      {FEATURE_TABS.map((tab) => {
        const isSelected = tab.id === props.activeTab;
        return (
          <button
            key={tab.id}
            id={`header-nav-${tab.id}`}
            type="button"
            aria-current={isSelected ? 'page' : undefined}
            onClick={() => props.onSelectTab?.(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 ${
              isSelected
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
            }`}
          >
            {t(tab.labelKey)}
          </button>
        );
      })}
    </nav>
  );
}

function HeaderControls(props: Omit<AppHeaderProps, 'activeTab' | 'onSelectTab'>): ReactElement {
  const { mode, onToggleMode, isDark, onToggleTheme, onOpenTour, onOpenProfile } = props;
  const label = `Current mode is ${mode}. Click to switch to ${mode === 'demo' ? 'live' : 'demo'} mode.`;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <button
        type="button"
        onClick={onToggleMode}
        aria-label={label}
        className="inline-flex rounded-full p-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600"
      >
        <span
          className={`px-3 py-1 rounded-full capitalize transition-colors ${
            mode === 'demo'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          Demo
        </span>
        <span
          className={`px-3 py-1 rounded-full capitalize transition-colors ${
            mode === 'live'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          Live
        </span>
      </button>

      <LanguageToggle />
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        className="p-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 min-w-[36px] min-h-[36px] flex items-center justify-center text-sm"
      >
        {isDark ? '☀️' : '🌙'}
      </button>
      <button type="button" onClick={onOpenTour} className="px-3 py-1.5 text-xs font-semibold rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
        Tour
      </button>
      <button type="button" onClick={onOpenProfile} className="px-3 py-1.5 text-xs font-semibold rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50">
        Profile
      </button>
      <HeaderMoreMenu onOpenTour={onOpenTour} />
    </div>
  );
}

/**
 * Redesigned header with airy layout, geometric logo, center nav links, and clean segmented controls.
 *
 * @param props - State, mode, theme, and dialog callback handlers.
 * @returns React component element.
 */
export function AppHeader(props: AppHeaderProps): ReactElement {
  const { t, language } = useLanguage();

  return (
    <header role="banner" className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-neutral-200/80 dark:border-neutral-800">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs" aria-hidden="true">
          सां
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-tight">
            Saans (सांस)
          </h1>
          <p lang={language === 'hi' ? 'hi' : undefined} className="hidden sm:block text-[11px] text-neutral-500 dark:text-neutral-400">
            {t('app.subtitle')}
          </p>
        </div>
      </div>
      <NavLinks activeTab={props.activeTab} onSelectTab={props.onSelectTab} />
      <HeaderControls {...props} />
    </header>
  );
}
