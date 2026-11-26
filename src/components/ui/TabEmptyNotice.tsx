// Informational placeholder shown in feature tabs when no air quality condition is active.
import type { ReactElement } from 'react';
import { Button } from './Button.js';

/** Props for TabEmptyNotice component. */
export interface TabEmptyNoticeProps {
  readonly tabName: string;
  readonly onLaunchDemo?: () => void;
  readonly onFocusSearch?: () => void;
  readonly className?: string;
}

/**
 * Renders an empty notice informing the user to select a city to populate the specific tab.
 *
 * @param props - Active tab name and recovery action handlers.
 * @returns React component element.
 */
export function TabEmptyNotice({
  tabName,
  onLaunchDemo,
  onFocusSearch,
  className = '',
}: TabEmptyNoticeProps): ReactElement {
  return (
    <section
      aria-label={`${tabName} Awaiting Data`}
      className={`p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center space-y-3 ${className}`.trim()}
    >
      <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
        {tabName} Requires Air Quality Data
      </h3>
      <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
        Choose a city, use your location, or enter a reading to generate personalized guidance for this section.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {onFocusSearch && (
          <Button size="sm" variant="primary" onClick={onFocusSearch}>
            Search City
          </Button>
        )}
        {onLaunchDemo && (
          <Button size="sm" variant="outline" onClick={onLaunchDemo}>
            Try Demo Mode
          </Button>
        )}
      </div>
    </section>
  );
}
