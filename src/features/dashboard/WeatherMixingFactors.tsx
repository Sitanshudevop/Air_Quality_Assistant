// Atmospheric mixing factors card explaining dispersion dynamics in plain words.
import type { ReactElement } from 'react';
import type { WeatherFactors } from '../../services/openMeteo.types.js';
import { detectInversion, getWeatherSummary } from '../../services/forecast.js';

/** Props for WeatherMixingFactors component. */
export interface WeatherMixingFactorsProps {
  factors: Partial<WeatherFactors>;
  className?: string;
}

function getMixingNarrative(inversion: boolean, wind: number, humidity: number): string {
  if (inversion) {
    return 'Thermal inversion active: ground-level cold air trapped beneath warm upper air layer suppresses vertical dispersion, keeping smog concentrated near surface.';
  }
  if (wind <= 1.5 && humidity >= 70) {
    return 'Calm wind (< 1.5 m/s) and high humidity produce stagnant atmospheric conditions, trapping vehicle and industrial emissions.';
  }
  if (wind >= 3.5) {
    return 'Convective air movement and active winds are lifting the atmospheric boundary layer, improving natural dispersion.';
  }
  return getWeatherSummary({ windSpeed: wind, humidity });
}

/**
 * Explains meteorological stagnation, thermal inversion, and ventilation factors in plain language.
 *
 * @param props - Atmospheric indicators and optional styling.
 * @returns React component element.
 */
export function WeatherMixingFactors({
  factors,
  className = '',
}: WeatherMixingFactorsProps): ReactElement {
  const temp = factors.temperature ?? 18;
  const humidity = factors.humidity ?? 65;
  const wind = factors.windSpeed ?? 1.2;
  const pressure = factors.surfacePressure ?? 1014;
  const isInversion = factors.isInversion ?? detectInversion({ windSpeed: wind, humidity });
  const narrative = getMixingNarrative(isInversion, wind, humidity);

  return (
    <section
      aria-label="Atmospheric Weather Mixing Factors"
      className={`p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 ${className}`.trim()}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Atmospheric Mixing Factors
        </h3>
        {isInversion && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            ⚠️ Inversion Active
          </span>
        )}
      </div>

      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed mb-3">
        {narrative}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
          <div className="text-neutral-500 dark:text-neutral-400">Temperature</div>
          <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">{temp}°C</div>
        </div>
        <div className="p-2 rounded bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
          <div className="text-neutral-500 dark:text-neutral-400">Humidity</div>
          <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">{humidity}%</div>
        </div>
        <div className="p-2 rounded bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
          <div className="text-neutral-500 dark:text-neutral-400">Wind Speed</div>
          <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">{wind} m/s</div>
        </div>
        <div className="p-2 rounded bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
          <div className="text-neutral-500 dark:text-neutral-400">Pressure</div>
          <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">{pressure} hPa</div>
        </div>
      </div>
    </section>
  );
}
