// Application header landmark with title, navigation, mode, language, print, and theme toggles.
import type { ReactElement } from 'react';
import type { OperatingMode } from '../../state/mode.js';
import { useLanguage } from '../../state/language.js';
import { LanguageToggle } from '../LanguageToggle.js';
import { PrintButton } from '../PrintButton.js';
import { Button } from '../ui/Button.js';

/** Props for AppHeader component. */
export interface AppHeaderProps {
  mode: OperatingMode;
  onToggleMode: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenTour: () => void;
  onOpenProfile: () => void;
}

/**
 * Main application header with brand title, controls navigation, mode switch, and theme toggle.
 *
 * @param props - State and interaction callback handlers.
 * @returns React component element.
 */
export function AppHeader({
  mode,
  onToggleMode,
  isDark,
  onToggleTheme,
  onOpenTour,
  onOpenProfile,
}: AppHeaderProps): ReactElement {
  const { t, language } = useLanguage();

  return (
    <header
      role="banner"
      className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Saans (सांस)
        </h1>
        <p lang={language === 'hi' ? 'hi' : undefined} className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
          {t('app.subtitle')}
        </p>
      </div>

      <nav aria-label="Main controls" className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleMode}
          aria-label={`Current mode is ${mode}. Click to switch to ${mode === 'demo' ? 'live' : 'demo'} mode.`}
        >
          Mode: <span className="capitalize font-bold ml-1">{mode}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </Button>

        <LanguageToggle />
        <PrintButton />

        <Button variant="ghost" size="sm" onClick={onOpenTour}>
          Tour
        </Button>

        <Button variant="secondary" size="sm" onClick={onOpenProfile}>
          Profile
        </Button>
      </nav>
    </header>
  );
}
