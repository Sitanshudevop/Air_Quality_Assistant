// Accessible accordion displaying DIY Corsi-Rosenthal box construction instructions.
import { useState, type ReactElement } from 'react';
import { CORSI_ROSENTHAL_GUIDE } from './indoorData.js';

/**
 * Collapsible guide for assembling a low-cost MERV-13 Corsi-Rosenthal air cleaner.
 *
 * @returns Accessible accordion element.
 */
export function CorsiRosenthalGuide(): ReactElement {
  const [open, setOpen] = useState<boolean>(false);
  const panelId = 'corsi-rosenthal-panel';

  return (
    <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 space-y-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-left text-sm font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded px-1 py-0.5"
      >
        <span>{CORSI_ROSENTHAL_GUIDE.title}</span>
        <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">
          {open ? 'Hide Guide' : 'Show DIY Steps'}
        </span>
      </button>

      {open && (
        <div id={panelId} className="pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
          <div>
            <strong>Materials:</strong>
            <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 mt-1 space-y-0.5">
              {CORSI_ROSENTHAL_GUIDE.materials.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Assembly Steps:</strong>
            <ol className="list-decimal list-inside text-neutral-700 dark:text-neutral-300 mt-1 space-y-0.5">
              {CORSI_ROSENTHAL_GUIDE.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
            Safety: {CORSI_ROSENTHAL_GUIDE.safetyNote}
          </p>
        </div>
      )}
    </div>
  );
}
