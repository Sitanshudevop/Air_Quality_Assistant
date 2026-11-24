// Hook for trapping keyboard focus and managing Escape dismissal in modal dialogs.
import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function handleTabKey(event: KeyboardEvent, container: HTMLElement): void {
  const focusables = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => !el.hasAttribute('disabled'));

  if (focusables.length === 0) {
    event.preventDefault();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

/**
 * Traps keyboard focus within a container element and restores focus on close.
 *
 * @param containerRef - Ref pointing to the dialog container element.
 * @param isOpen - Whether the dialog is currently visible.
 * @param onClose - Callback to invoke when Escape key is pressed.
 * @param triggerRef - Optional ref to the element that triggered the dialog.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void,
  triggerRef?: RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const previous = triggerRef?.current ?? (document.activeElement as HTMLElement | null);
    const container = containerRef.current;
    const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? container).focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Tab') {
        handleTabKey(event, container);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [isOpen, onClose, containerRef, triggerRef]);
}
