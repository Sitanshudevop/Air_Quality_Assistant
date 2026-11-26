// Standardized tab page header with breadcrumb, adaptive title, subtitle, and action slots.
import type { ReactElement } from 'react';

/** Props for TabHeader component. */
export interface TabHeaderProps {
  readonly breadcrumbCurrent: string;
  readonly title: string;
  readonly subtitle: string;
  readonly actions?: ReactElement;
  readonly isHindi?: boolean;
  readonly className?: string;
}

/**
 * Standard page header applied across all feature views establishing visual rhythm and breadcrumb hierarchy.
 *
 * @param props - Breadcrumb title, main heading, supportive subtitle, and optional actions.
 * @returns React component element.
 */
export function TabHeader({
  breadcrumbCurrent,
  title,
  subtitle,
  actions,
  isHindi = false,
  className = '',
}: TabHeaderProps): ReactElement {
  return (
    <div className={`space-y-2 pb-2 border-b border-neutral-200/80 dark:border-neutral-800 ${className}`.trim()}>
      <nav aria-label="Breadcrumb" className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
        <span>Home</span> <span className="mx-1">/</span> <span className="text-neutral-900 dark:text-neutral-100 font-semibold">{breadcrumbCurrent}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 lang={isHindi ? 'hi' : undefined} className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            {title}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
