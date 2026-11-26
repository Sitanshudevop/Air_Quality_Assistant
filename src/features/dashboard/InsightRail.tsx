// Right-side insight rail: atmospheric factors widget and emergency contacts.
import type { ReactElement } from 'react';
import { Thermometer, Droplets, Wind, Gauge, Phone } from 'lucide-react';
import type { WeatherFactors } from '../../services/openMeteo.types.js';
import { detectInversion } from '../../services/forecast.js';

/** Props for InsightRail component. */
export interface InsightRailProps {
  readonly weatherFactors?: Partial<WeatherFactors> | null;
  readonly origin?: 'live' | 'demo' | 'manual';
  readonly sourceLabel?: string;
}

interface MetricRowProps {
  readonly icon: ReactElement;
  readonly label: string;
  readonly value: string;
  readonly pct: number;
}

function MetricRow({ icon, label, value, pct }: MetricRowProps): ReactElement {
  return (
    <div className="flex items-center gap-3">
      <span className="text-bento-muted flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-bento-muted truncate">{label}</span>
          <span className="text-xs font-bold text-bento-ink dark:text-white ml-2">{value}</span>
        </div>
        <div className="w-full bg-neutral-100 dark:bg-neutral-700 h-1 rounded-full overflow-hidden">
          <div className="bg-bento-ink dark:bg-white h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

function WeatherWidget(props: { factors: Partial<WeatherFactors>; origin?: string; sourceLabel?: string }): ReactElement {
  const { factors, origin, sourceLabel } = props;
  const temp = factors.temperature ?? 0;
  const humidity = factors.humidity ?? 0;
  const wind = factors.windSpeed ?? 0;
  const pressure = factors.surfacePressure ?? 1013;
  const isInversion = factors.isInversion ?? detectInversion({ windSpeed: wind, humidity });
  const src = sourceLabel ?? (origin === 'demo' ? 'Curated Model' : 'Open-Meteo');

  return (
    <section aria-label="Atmospheric Mixing Factors" className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-bento-ink dark:text-white">Atmospheric Factors</h3>
        {isInversion && (
          <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">Inversion</span>
        )}
      </div>
      <p className="text-[11px] text-bento-muted">Source: {src}</p>
      <div className="space-y-3">
        <MetricRow icon={<Thermometer size={14} />} label="Temperature" value={`${temp}°C`} pct={(temp + 10) * 2} />
        <MetricRow icon={<Droplets size={14} />} label="Humidity" value={`${humidity}%`} pct={humidity} />
        <MetricRow icon={<Wind size={14} />} label="Wind Speed" value={`${wind} m/s`} pct={wind * 20} />
        <MetricRow icon={<Gauge size={14} />} label="Pressure" value={`${pressure} hPa`} pct={((pressure - 980) / 60) * 100} />
      </div>
    </section>
  );
}

function EmergencyWidget(): ReactElement {
  return (
    <section aria-label="Emergency Contacts" className="bg-bento-blush rounded-3xl p-5 space-y-3">
      <h3 className="text-sm font-bold text-bento-ink">Emergency Contacts</h3>
      <div className="space-y-2">
        {([['112', 'National Emergency'], ['102', 'Ambulance']] as const).map(([num, label]) => (
          <a
            key={num}
            href={`tel:${num}`}
            className="flex items-center gap-3 p-2 bg-white/60 rounded-2xl hover:bg-white/80 transition-colors"
          >
            <Phone size={14} className="text-rose-600 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm font-bold text-bento-ink">{num}</span>
            <span className="text-xs text-bento-muted">{label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

/**
 * Right-column insight rail with weather factors and emergency contacts.
 *
 * @param props - Weather factors, data origin, and source label.
 * @returns React element.
 */
export function InsightRail({ weatherFactors, origin, sourceLabel }: InsightRailProps): ReactElement {
  const hasWeather = Boolean(weatherFactors && typeof weatherFactors.temperature === 'number');
  return (
    <aside aria-label="Insight rail" className="flex flex-col gap-4">
      {hasWeather && weatherFactors ? (
        <WeatherWidget factors={weatherFactors} origin={origin} sourceLabel={sourceLabel} />
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-sm text-xs text-bento-muted text-center">
          Atmospheric factors load with air quality data.
        </div>
      )}
      <EmergencyWidget />
    </aside>
  );
}
