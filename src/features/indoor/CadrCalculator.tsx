// Interactive HEPA purifier CADR sizing calculator driven by domain engine.
import { useState, type ReactElement } from 'react';
import { calculateCadrRequirement } from '../../domain/indoor.js';
import { clampCadrInputs } from './indoorData.js';

/** Props for CadrCalculator component. */
export interface CadrCalculatorProps {
  readonly defaultAreaSqFt?: number;
}

const inputCls =
  'w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500';

/**
 * Computes required Clean Air Delivery Rate (CFM and m3/hr) for a room at target ACH.
 *
 * @param props - Optional initial room floor area in sq ft.
 * @returns Interactive CADR calculator card element.
 */
export function CadrCalculator({ defaultAreaSqFt = 180 }: CadrCalculatorProps): ReactElement {
  const [area, setArea] = useState<number>(defaultAreaSqFt);
  const [height, setHeight] = useState<number>(9);
  const [ach, setAch] = useState<number>(5);

  const clamped = clampCadrInputs(area, height, ach);
  const cadrCfm = calculateCadrRequirement(clamped.areaSqFt, clamped.ceilingHeightFt, clamped.targetAch);
  const cadrM3Hr = Math.round(cadrCfm * 1.699);

  return (
    <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 space-y-3">
      <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
        Purifier CADR Sizing Calculator
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label htmlFor="cadr-area" className="block font-semibold mb-1">
            Room Area (sq ft)
          </label>
          <input
            id="cadr-area"
            type="number"
            min={10}
            max={5000}
            value={clamped.areaSqFt}
            onChange={(e) => setArea(Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="cadr-height" className="block font-semibold mb-1">
            Ceiling Height (ft)
          </label>
          <input
            id="cadr-height"
            type="number"
            min={6}
            max={20}
            value={clamped.ceilingHeightFt}
            onChange={(e) => setHeight(Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="cadr-ach" className="block font-semibold mb-1">
            Target ACH
          </label>
          <input
            id="cadr-ach"
            type="number"
            min={1}
            max={12}
            value={clamped.targetAch}
            onChange={(e) => setAch(Number(e.target.value))}
            className={inputCls}
          />
        </div>
      </div>

      <div aria-live="polite" className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs">
        Required Clean Air Delivery Rate:{' '}
        <strong data-testid="cadr-cfm" className="text-sm text-sky-900 dark:text-sky-200">
          {cadrCfm} CFM
        </strong>{' '}
        ({cadrM3Hr} m³/hr) for {clamped.targetAch} air changes/hour.
      </div>
    </div>
  );
}
