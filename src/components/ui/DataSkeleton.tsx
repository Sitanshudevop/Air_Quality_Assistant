// Skeleton loader for Live mode while air quality and forecast queries are in flight.
import type { ReactElement } from 'react';

/** Props for DataSkeleton component. */
export interface DataSkeletonProps {
  readonly className?: string;
}

/**
 * Accessible skeleton placeholder mimicking the layout of TodayDashboard while loading.
 *
 * @param props - Optional container styling.
 * @returns React component element with aria-busy and status semantics.
 */
export function DataSkeleton({ className = '' }: DataSkeletonProps): ReactElement {
  return (
    <article
      role="status"
      aria-label="Loading air quality data"
      aria-busy="true"
      className={`p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-6 animate-pulse ${className}`.trim()}
    >
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="space-y-2">
          <div className="h-5 w-40 bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-3 w-28 bg-neutral-200 dark:bg-neutral-800 rounded" />
        </div>
        <div className="h-6 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
      </div>

      <div className="flex justify-center py-4">
        <div className="h-28 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`skel-pol-${i}`} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 space-y-2">
            <div className="h-3 w-12 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="h-5 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
        ))}
      </div>

      <span className="sr-only">Fetching live air quality metrics...</span>
    </article>
  );
}
