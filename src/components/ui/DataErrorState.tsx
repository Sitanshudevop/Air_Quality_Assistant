// Error state card for Live mode with retry and manual reading fallback options.
import type { ReactElement } from 'react';
import { Button } from './Button.js';

/** Props for DataErrorState component. */
export interface DataErrorStateProps {
  readonly message?: string;
  readonly onRetry?: () => void;
  readonly onManualReading?: () => void;
  readonly className?: string;
}

/**
 * Accessible error state displaying failed API lookup notice with retry and manual fallback.
 *
 * @param props - Error message and recovery callbacks.
 * @returns React component element.
 */
export function DataErrorState({
  message = 'Failed to load live air quality data.',
  onRetry,
  onManualReading,
  className = '',
}: DataErrorStateProps): ReactElement {
  return (
    <article
      role="alert"
      aria-label="Air Quality Loading Error"
      className={`p-6 rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/30 text-center space-y-4 ${className}`.trim()}
    >
      <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center text-rose-700 dark:text-rose-300 text-xl font-bold" aria-hidden="true">
        ⚠️
      </div>

      <div className="space-y-1 max-w-md mx-auto">
        <h2 className="text-base font-bold text-rose-950 dark:text-rose-200">
          Unable to Load Live Data
        </h2>
        <p className="text-xs text-rose-800 dark:text-rose-300">
          {message}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {onRetry && (
          <Button size="sm" variant="primary" onClick={onRetry}>
            Retry Request
          </Button>
        )}
        {onManualReading && (
          <Button size="sm" variant="outline" onClick={onManualReading}>
            Enter Manual Reading
          </Button>
        )}
      </div>
    </article>
  );
}
