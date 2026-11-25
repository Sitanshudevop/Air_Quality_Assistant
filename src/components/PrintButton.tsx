// Keyboard-accessible print button triggering browser print preview.
import type { ReactElement } from 'react';
import { useLanguage } from '../state/language.js';

/** Props for PrintButton component. */
export interface PrintButtonProps {
  readonly className?: string;
  readonly label?: string;
}

/**
 * Accessible button invoking window.print() for the family emergency smog plan.
 *
 * @param props - Optional CSS class and custom label.
 * @returns Print trigger button hidden during print output.
 */
export function PrintButton({ className = '', label }: PrintButtonProps): ReactElement {
  const { t, language } = useLanguage();
  const displayLabel = label ?? t('action.print');

  const handlePrint = (): void => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      aria-label="Print Family Smog Plan"
      lang={language === 'hi' ? 'hi' : undefined}
      className={`no-print inline-flex items-center justify-center px-2.5 py-1 text-xs min-h-[36px] font-medium rounded-md border border-neutral-400 bg-transparent text-neutral-800 hover:bg-neutral-100 dark:border-neutral-500 dark:text-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-sky-500 ${className}`.trim()}
    >
      {displayLabel}
    </button>
  );
}
