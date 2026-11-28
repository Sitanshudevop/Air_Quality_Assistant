// Compact mode-aware filter bar for Demo selectors or Live search results & manual AQI entry.
import type { ReactElement } from 'react';
import { DEMO_PERSONAS } from '../../constants/demo/personas.js';
import { DEMO_SNAPSHOTS } from '../../constants/demo/snapshots.js';
import type { DemoCityId, DemoPersonaId } from '../../constants/demo/types.js';
import type { ManualAirQualityData } from '../../services/manualReading.js';
import type { AirQualityData, ForecastData } from '../../services/openMeteo.types.js';
import { LiveLocationControls } from './LiveLocationControls.js';
import type { LiveLocationState } from './useLiveLocation.js';

/** Props for LocationBar component. */
export interface LocationBarProps {
  readonly isDemo: boolean;
  readonly demoCityId: DemoCityId;
  readonly demoPersonaId: DemoPersonaId;
  readonly onSelectDemoCity: (cityId: DemoCityId) => void;
  readonly onSelectDemoPersona: (personaId: DemoPersonaId) => void;
  readonly onLiveData: (aq: AirQualityData, fc: ForecastData | null, label: string) => void;
  readonly onManualReading: (reading: ManualAirQualityData) => void;
  readonly liveState?: LiveLocationState;
}

const selectCls =
  'rounded-full border border-slate-400 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5 min-h-[44px] sm:min-h-[36px] text-xs font-medium text-bento-ink dark:text-neutral-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-bento-ink/25';

function LiveResultsStrip({ state }: { state: LiveLocationState }): ReactElement | null {
  const hasContent = state.results.length > 0 || Boolean(state.statusMsg) || state.showManual;
  if (!hasContent) return null;

  return (
    <div className="space-y-2.5 text-xs bg-bento-canvas/70 dark:bg-neutral-800/50 rounded-2xl px-4 py-3">
      {state.results.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300 mr-1">Select city:</span>
          {state.results.slice(0, 5).map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => state.onSelectLocation(loc)}
              className="px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-full border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-bento-ink dark:text-white font-semibold hover:bg-bento-lavender transition-colors shadow-sm"
            >
              {loc.displayName}
            </button>
          ))}
        </div>
      )}
      {state.showManual && (
        <form onSubmit={state.onManualSubmit} className="flex flex-wrap items-center gap-2">
          <label htmlFor="manual-aqi-input" className="font-semibold text-xs text-bento-ink dark:text-neutral-200">
            Purifier/App AQI:
          </label>
          <input
            id="manual-aqi-input"
            type="number"
            min={0}
            max={500}
            value={state.manualAqi}
            onChange={(e) => state.onChangeManualAqi(e.target.value)}
            className="w-24 min-h-[44px] sm:min-h-[36px] rounded-full border border-slate-400 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-bento-ink/25"
          />
          <button type="submit" className="px-4 py-1.5 min-h-[44px] sm:min-h-[36px] rounded-full bg-bento-ink text-white dark:bg-white dark:text-bento-ink text-xs font-semibold hover:opacity-90 transition-opacity">
            Apply Manual Reading
          </button>
        </form>
      )}
      {state.statusMsg && <p role="status" className="text-slate-700 dark:text-neutral-300">{state.statusMsg}</p>}
    </div>
  );
}

/**
 * Renders sleek Demo city/persona filter pills or Live search results & manual fallback.
 *
 * @param props - Active operating mode, demo selection state, and live/manual callbacks.
 * @returns Filter bar element or null when Live mode has no active results/status.
 */
export function LocationBar({
  isDemo, demoCityId, demoPersonaId, onSelectDemoCity, onSelectDemoPersona,
  onLiveData, onManualReading, liveState,
}: LocationBarProps): ReactElement | null {
  if (isDemo) {
    return (
      <section aria-label="Location and household selector" className="no-print flex flex-wrap items-center gap-4 text-xs bg-bento-canvas/70 dark:bg-neutral-800/50 rounded-2xl px-4 py-2.5">
        <div className="flex items-center gap-2">
          <label htmlFor="demo-city-select" className="font-semibold text-slate-700 dark:text-neutral-300">Demo City</label>
          <select id="demo-city-select" value={demoCityId} onChange={(e) => onSelectDemoCity(e.target.value as DemoCityId)} className={selectCls}>
            {Object.values(DEMO_SNAPSHOTS).map((snap) => (
              <option key={snap.cityId} value={snap.cityId}>{snap.cityName} (AQI {snap.aqi})</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="demo-persona-select" className="font-semibold text-slate-700 dark:text-neutral-300">Household Persona</label>
          <select id="demo-persona-select" value={demoPersonaId} onChange={(e) => onSelectDemoPersona(e.target.value as DemoPersonaId)} className={selectCls}>
            {Object.values(DEMO_PERSONAS).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </section>
    );
  }

  if (liveState) return <LiveResultsStrip state={liveState} />;

  return (
    <section aria-label="Location and household selector" className="no-print p-3 rounded-2xl bg-bento-canvas/70 dark:bg-neutral-800/50">
      <LiveLocationControls onLiveData={onLiveData} onManualReading={onManualReading} />
    </section>
  );
}
