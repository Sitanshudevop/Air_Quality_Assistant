// Reusable WCAG 2.2 AA compliant button component.
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';

/** Visual variants available for Button. */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/** Sizes available for Button. */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Props for Button component. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-sky-700 text-white hover:bg-sky-800 dark:bg-sky-500 dark:text-neutral-950 dark:hover:bg-sky-400 focus:ring-sky-500',
  secondary:
    'bg-neutral-200 text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 focus:ring-neutral-400',
  outline:
    'border border-neutral-400 bg-transparent text-neutral-800 hover:bg-neutral-100 dark:border-neutral-500 dark:text-neutral-100 dark:hover:bg-neutral-800 focus:ring-sky-500',
  ghost:
    'bg-transparent text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:ring-sky-500',
  danger:
    'bg-rose-700 text-white hover:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-500 focus:ring-rose-500',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs min-h-[36px]',
  md: 'px-4 py-2 text-sm min-h-[44px]',
  lg: 'px-5 py-2.5 text-base min-h-[48px]',
};

/**
 * Accessible button with visible focus styles and touch target sizing.
 *
 * @param props - Button properties and event handlers.
 * @returns React component element.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  children,
  ...rest
}: ButtonProps): ReactElement {
  const base =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClass = VARIANT_STYLES[variant];
  const sizeClass = SIZE_STYLES[size];

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variantClass} ${sizeClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
