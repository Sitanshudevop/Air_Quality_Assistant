// Mode-aware location and household persona selector bar.
import type { ReactElement } from 'react';
import { DEMO_PERSONAS } from '../../constants/demo/personas.js';
import { DEMO_SNAPSHOTS } from '../../constants/demo/snapshots.js';
import type { DemoCityId, DemoPersonaId } from '../../constants/demo/types.js';
import type { ManualAirQualityData } from '../../services/manualReading.js';
import type { AirQualityData, ForecastData } from '../../services/openMeteo.types.js';
import { LiveLocationControls } from './LiveLocationControls.js';

/** Props for LocationBar component. */
export interface LocationBarProps {
  readonly isDemo: boolean;
  readonly demoCityId: DemoCityId;
  readonly demoPersonaId: DemoPersonaId;
  readonly onSelectDemoCity: (cityId: DemoCityId) => void;
  readonly onSelectDemoPersona: (personaId: DemoPersonaId) => void;
  readonly onLiveData: (aq: AirQualityData, fc: ForecastData | null, label: string) => void;
  readonly onManualReading: (reading: ManualAirQualityData) => void;
}

const selectCls =
  'rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-50';

/**
 * Renders frozen Demo city/persona selectors or Live Open-Meteo search & manual fallback controls.
 *
 * @param props - Active operating mode, demo selection state, and live/manual callbacks.
 * @returns Location and persona control bar element.
 */
export function LocationBar({
  isDemo,
  demoCityId,
  demoPersonaId,
  onSelectDemoCity,
  onSelectDemoPersona,
  onLiveData,
  onManualReading,
}: LocationBarProps): ReactElement {
  return (
    <section
      aria-label="Location and household selector"
      className="no-print p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
    >
      {isDemo ? (
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <label htmlFor="demo-city-select" className="font-semibold">
              Demo City
            </label>
            <select
              id="demo-city-select"
              value={demoCityId}
              onChange={(e) => onSelectDemoCity(e.target.value as DemoCityId)}
              className={selectCls}
            >
              {Object.values(DEMO_SNAPSHOTS).map((snap) => (
                <option key={snap.cityId} value={snap.cityId}>
                  {snap.cityName} (AQI {snap.aqi})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="demo-persona-select" className="font-semibold">
              Household Persona
            </label>
            <select
              id="demo-persona-select"
              value={demoPersonaId}
              onChange={(e) => onSelectDemoPersona(e.target.value as DemoPersonaId)}
              className={selectCls}
            >
              {Object.values(DEMO_PERSONAS).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <LiveLocationControls onLiveData={onLiveData} onManualReading={onManualReading} />
      )}
    </section>
  );
}
