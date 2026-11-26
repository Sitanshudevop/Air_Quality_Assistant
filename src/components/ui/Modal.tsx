// Accessible focus-trapped dialog modal component.
import { useRef, type ReactElement, type ReactNode, type RefObject } from 'react';
import { useFocusTrap } from '../../features/onboarding/useFocusTrap.js';

/** Props for Modal dialog component. */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  triggerRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
}

/**
 * Accessible modal dialog with focus trapping and Escape dismissal.
 *
 * @param props - Dialog state, handlers, accessibility attributes, and content.
 * @returns React component element or null.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  triggerRef,
  children,
  className = '',
}: ModalProps): ReactElement | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, isOpen, onClose, triggerRef);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        tabIndex={-1}
        className={`relative w-[calc(100vw-2rem)] max-w-lg max-h-[85dvh] overflow-y-auto rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl p-5 sm:p-6 text-neutral-900 dark:text-neutral-50 focus:outline-none ${className}`.trim()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-lg sm:text-xl font-semibold break-words">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 break-words">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-sky-500 shrink-0"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
