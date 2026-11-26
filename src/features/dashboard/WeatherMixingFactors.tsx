// Atmospheric mixing factors card explaining dispersion dynamics in plain words.
import type { ReactElement } from 'react';
import { Thermometer, Droplets, Wind as WindIcon, Gauge } from 'lucide-react';
import type { WeatherFactors } from '../../services/openMeteo.types.js';
import { detectInversion, getWeatherSummary } from '../../services/forecast.js';

/** Props for WeatherMixingFactors component. */
export interface WeatherMixingFactorsProps {
  factors?: Partial<WeatherFactors> | null;
  origin?: 'live' | 'demo' | 'manual';
  sourceLabel?: string;
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

function getDisplaySource(sourceLabel?: string, origin?: string): string {
  if (sourceLabel) return sourceLabel;
  return origin === 'demo' ? 'Curated Model' : 'Open-Meteo Weather';
}

function isValidWeather(f?: Partial<WeatherFactors> | null): f is Partial<WeatherFactors> & { temperature: number; humidity: number } {
  return Boolean(f && typeof f.temperature === 'number' && typeof f.humidity === 'number');
}

/**
 * Explains meteorological stagnation, thermal inversion, and ventilation factors in plain language.
 *
 * @param props - Atmospheric indicators, origin label, and optional styling.
 * @returns React component element or null when factors are absent.
 */
export function WeatherMixingFactors({
  factors,
  origin,
  sourceLabel,
  className = '',
}: WeatherMixingFactorsProps): ReactElement | null {
  if (!isValidWeather(factors)) return null;

  const temp = factors.temperature;
  const humidity = factors.humidity;
  const wind = factors.windSpeed ?? 0;
  const pressure = factors.surfacePressure ?? 1013;
  const isInversion = factors.isInversion ?? detectInversion({ windSpeed: wind, humidity });
  const narrative = getMixingNarrative(isInversion, wind, humidity);
  const displaySource = getDisplaySource(sourceLabel, origin);

  return (
    <section
      aria-label="Atmospheric Weather Mixing Factors"
      className={`p-5 rounded-[24px] border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Atmospheric Mixing Factors
          </h3>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            Source: {displaySource}
          </span>
        </div>
        {isInversion && (
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            Inversion Active
          </span>
        )}
      </div>

      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
        {narrative}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-3 rounded-2xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-2.5">
          <Thermometer size={18} className="text-neutral-500 flex-shrink-0" aria-hidden="true" />
          <div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Temperature</div>
            <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">{temp}°C</div>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-2.5">
          <Droplets size={18} className="text-neutral-500 flex-shrink-0" aria-hidden="true" />
          <div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Humidity</div>
            <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">{humidity}%</div>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-2.5">
          <WindIcon size={18} className="text-neutral-500 flex-shrink-0" aria-hidden="true" />
          <div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Wind Speed</div>
            <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">{wind} m/s</div>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-2.5">
          <Gauge size={18} className="text-neutral-500 flex-shrink-0" aria-hidden="true" />
          <div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Pressure</div>
            <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">{pressure} hPa</div>
          </div>
        </div>
      </div>
    </section>
  );
}
