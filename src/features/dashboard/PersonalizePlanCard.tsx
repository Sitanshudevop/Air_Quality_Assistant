// Segmented-control inline form for rapid household, travel, and home profile customization.
import { useState, type ReactElement } from 'react';
import type { StoredProfile } from '../../services/profile.types.js';
import { getProfile, saveProfile } from '../../services/profile.js';

/** Props for PersonalizePlanCard component. */
export interface PersonalizePlanCardProps {
  readonly onProfileUpdated?: (profile: StoredProfile) => void;
  readonly className?: string;
}

type SegmentTab = 'household' | 'travel' | 'home';

const selectCls =
  'w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-teal-600';

function HouseholdFields(props: { vuln: string; onChange: (v: string) => void }): ReactElement {
  return (
    <div className="space-y-1.5">
      <label htmlFor="plan-vuln-select" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
        Highest Vulnerability in Household
      </label>
      <select id="plan-vuln-select" value={props.vuln} onChange={(e) => props.onChange(e.target.value)} className={selectCls}>
        <option value="healthy_adult">Healthy Adults (Standard)</option>
        <option value="respiratory">Asthma / Respiratory / COPD</option>
        <option value="child">Children (under 12)</option>
        <option value="elderly">Elderly (65+)</option>
        <option value="pregnant">Pregnancy</option>
      </select>
    </div>
  );
}

function TravelFields(props: { mode: string; onChange: (m: string) => void }): ReactElement {
  return (
    <div className="space-y-1.5">
      <label htmlFor="plan-travel-select" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
        Primary Daily Commute Mode
      </label>
      <select id="plan-travel-select" value={props.mode} onChange={(e) => props.onChange(e.target.value)} className={selectCls}>
        <option value="two-wheeler">Two-Wheeler (Motorcycle / Scooter)</option>
        <option value="metro">Metro Rail</option>
        <option value="bus">City Bus</option>
        <option value="walk">Walking / Cycling</option>
        <option value="car">Car (AC Windows Closed)</option>
      </select>
    </div>
  );
}

function HomeFields(props: { purifier: boolean; onToggle: () => void; fuel: string; onFuel: (f: string) => void }): ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <label htmlFor="plan-fuel-select" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Cooking Fuel</label>
        <select id="plan-fuel-select" value={props.fuel} onChange={(e) => props.onFuel(e.target.value)} className={selectCls}>
          <option value="lpg">LPG / Piped Gas</option>
          <option value="induction">Electric / Induction</option>
          <option value="biomass">Biomass / Chulha</option>
        </select>
      </div>
      <div className="flex items-center gap-2 pt-5">
        <input id="plan-purifier-chk" type="checkbox" checked={props.purifier} onChange={props.onToggle} className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600" />
        <label htmlFor="plan-purifier-chk" className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Room HEPA Purifier Active</label>
      </div>
    </div>
  );
}

/**
 * Segmented-control inline card providing quick adjustments to the active household smog plan.
 *
 * @param props - Callback invoked after persisting profile updates.
 * @returns React component element.
 */
export function PersonalizePlanCard({ onProfileUpdated, className = '' }: PersonalizePlanCardProps): ReactElement {
  const [segment, setSegment] = useState<SegmentTab>('household');
  const [prof, setProf] = useState<StoredProfile>(() => getProfile());

  const handleSave = (): void => {
    const saved = saveProfile(prof);
    onProfileUpdated?.(saved);
  };

  return (
    <section aria-labelledby="personalize-plan-heading" className={`p-6 rounded-3xl bg-bento-canvas/50 dark:bg-neutral-800/40 space-y-4 ${className}`.trim()}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="personalize-plan-heading" className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Personalize your plan
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Calibrate exposure calculations, routine diurnal locks, and room hacks
          </p>
        </div>

        <div role="radiogroup" aria-label="Personalization Category" className="inline-flex rounded-full p-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
          {(['household', 'travel', 'home'] as const).map((seg) => (
            <button
              key={seg}
              type="button"
              role="radio"
              aria-checked={segment === seg}
              onClick={() => setSegment(seg)}
              className={`px-3 py-1 font-semibold rounded-full capitalize transition-colors ${
                segment === seg
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {seg}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-1">
        {segment === 'household' && (
          <HouseholdFields vuln={prof.vulnerabilities?.[0] ?? 'healthy_adult'} onChange={(v) => setProf((prev) => ({ ...prev, vulnerabilities: [v] }))} />
        )}
        {segment === 'travel' && (
          <TravelFields mode={prof.commuteMode ?? 'two-wheeler'} onChange={(m) => setProf((prev) => ({ ...prev, commuteMode: m }))} />
        )}
        {segment === 'home' && (
          <HomeFields
            purifier={Boolean(prof.hasPurifier)}
            onToggle={() => setProf((prev) => ({ ...prev, hasPurifier: !prev.hasPurifier }))}
            fuel={prof.cookingFuel ?? 'lpg'}
            onFuel={(f) => setProf((prev) => ({ ...prev, cookingFuel: f as 'lpg' | 'induction' | 'biomass' }))}
          />
        )}
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-teal-600 transition-colors shadow-sm"
        >
          <span>Update my plan</span>
          <span aria-hidden="true">➔</span>
        </button>
      </div>
    </section>
  );
}
