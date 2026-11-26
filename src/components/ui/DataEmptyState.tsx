// Designed empty state card for Live mode when no location has been selected.
import type { ReactElement } from 'react';
import { Button } from './Button.js';

/** Props for DataEmptyState component. */
export interface DataEmptyStateProps {
  readonly onFocusSearch?: () => void;
  readonly onUseLocation?: () => void;
  readonly onManualReading?: () => void;
  readonly onLaunchDemo?: () => void;
  readonly className?: string;
}

/**
 * Renders an accessible, designed empty state when no city or reading is selected in Live mode.
 *
 * @param props - Interaction callbacks for search, geolocation, manual reading, and demo launch.
 * @returns React component element.
 */
export function DataEmptyState({
  onFocusSearch,
  onUseLocation,
  onManualReading,
  onLaunchDemo,
  className = '',
}: DataEmptyStateProps): ReactElement {
  return (
    <article
      aria-label="No Air Quality Data Selected"
      className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-center space-y-4 ${className}`.trim()}
    >
      <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-2xl" aria-hidden="true">
        🍃
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Live Air Quality
        </h2>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
          Choose a city, use your location, or enter a reading to see live air quality
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {onFocusSearch && (
          <Button size="sm" variant="primary" onClick={onFocusSearch}>
            Search City
          </Button>
        )}
        {onUseLocation && (
          <Button size="sm" variant="secondary" onClick={onUseLocation}>
            Use Location
          </Button>
        )}
        {onManualReading && (
          <Button size="sm" variant="outline" onClick={onManualReading}>
            Enter a Reading
          </Button>
        )}
      </div>

      {onLaunchDemo && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onLaunchDemo}
            className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-500 rounded px-2 py-1"
          >
            Try the demo
          </button>
        </div>
      )}
    </article>
  );
}
