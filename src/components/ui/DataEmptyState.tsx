// Designed empty state card for Live mode when no location has been selected.
import type { ReactElement } from 'react';
import { Wind, LocateFixed, Search } from 'lucide-react';
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
      className={`p-8 rounded-3xl bg-bento-canvas/60 dark:bg-neutral-800/40 text-center space-y-4 ${className}`.trim()}
    >
      <div className="w-12 h-12 mx-auto rounded-full bg-bento-lavender text-bento-ink flex items-center justify-center" aria-hidden="true">
        <Wind size={22} />
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h2 className="text-lg font-bold tracking-tight text-bento-ink dark:text-neutral-50">
          Live Air Quality
        </h2>
        <p className="text-xs sm:text-sm text-bento-muted dark:text-neutral-400">
          Choose a city, use your location, or enter a reading to see live air quality
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
        {onUseLocation && (
          <Button size="sm" variant="primary" onClick={onUseLocation}>
            <LocateFixed size={14} className="mr-1.5 inline" aria-hidden="true" />
            Use My Location
          </Button>
        )}
        {onFocusSearch && (
          <Button size="sm" variant="secondary" onClick={onFocusSearch}>
            <Search size={14} className="mr-1.5 inline" aria-hidden="true" />
            Search City
          </Button>
        )}
        {onManualReading && (
          <Button size="sm" variant="outline" onClick={onManualReading}>
            Enter a Reading
          </Button>
        )}
      </div>

      {onLaunchDemo && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onLaunchDemo}
            className="text-xs font-semibold text-bento-ink dark:text-sky-400 hover:underline focus:outline-none focus:ring-2 focus:ring-bento-ink/30 rounded px-2 py-1"
          >
            Try the demo
          </button>
        </div>
      )}
    </article>
  );
}
