// Accessible More menu popover providing secondary triggers for Tour, Print, and Citations.
import { useState, useRef, useEffect, type ReactElement } from 'react';

/** Props for HeaderMoreMenu component. */
export interface HeaderMoreMenuProps {
  readonly onOpenTour: () => void;
  readonly className?: string;
}

/**
 * Renders an accessible dropdown menu holding Print plan, Guided tour, and data references.
 *
 * @param props - Dialog trigger callbacks.
 * @returns React component element.
 */
export function HeaderMoreMenu({ onOpenTour, className = '' }: HeaderMoreMenuProps): ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handlePrint = (): void => {
    setIsOpen(false);
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div ref={menuRef} className={`relative inline-block ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="More options"
        className="px-3 py-1.5 text-xs font-semibold rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-600 transition-colors"
      >
        More ▾
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="More options menu"
          className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg p-2 z-50 text-xs space-y-1"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handlePrint}
            className="w-full text-left px-3 py-2 rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            🖨️ Print Plan
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setIsOpen(false); onOpenTour(); }}
            className="w-full text-left px-3 py-2 rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            🗺️ Guided Tour
          </button>
          <a
            href="https://cpcb.nic.in"
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            className="block w-full text-left px-3 py-2 rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            📜 CPCB NAAQS (2009)
          </a>
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            className="block w-full text-left px-3 py-2 rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            🌐 Open-Meteo Data
          </a>
        </div>
      )}
    </div>
  );
}
