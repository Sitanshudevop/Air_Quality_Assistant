// Accessible semantic HTML data table alternative for hourly air quality forecasts.
import type { ReactElement } from 'react';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';
import { formatHour } from './outlookUtils.js';

/** Props for OutlookDataTable component. */
export interface OutlookDataTableProps {
  points: readonly HourlyAirQualityPoint[];
  className?: string;
}

function getHourlyAdvice(aqi: number): string {
  if (aqi <= 100) return 'Safe for outdoor exercise and ventilation';
  if (aqi <= 200) return 'Limit strenuous outdoor exercise for sensitive groups';
  if (aqi <= 300) return 'Avoid prolonged outdoor exertion; use N95';
  return 'Keep windows sealed; run indoor purifier on high';
}

/**
 * Accessible table providing structured tabular air quality predictions.
 *
 * @param props - Hourly air quality points and optional styling.
 * @returns React component element.
 */
export function OutlookDataTable({
  points,
  className = '',
}: OutlookDataTableProps): ReactElement {
  return (
    <div className={`overflow-x-auto ${className}`.trim()}>
      <table className="w-full text-left text-xs border-collapse">
        <caption className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2 text-left">
          Hourly Air Quality Forecast and Activity Windows
        </caption>
        <thead>
          <tr className="border-b border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
            <th scope="col" className="p-2.5">Time</th>
            <th scope="col" className="p-2.5">Est. AQI</th>
            <th scope="col" className="p-2.5">Category</th>
            <th scope="col" className="p-2.5">PM2.5 (µg/m³)</th>
            <th scope="col" className="p-2.5">Recommendation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {points.map((pt, idx) => {
            const timeLabel = formatHour(pt.time);
            const aqi = Number.isFinite(pt.aqi) ? Math.max(0, Math.round(pt.aqi)) : 0;
            const pm25 = typeof pt.pm2_5 === 'number' && Number.isFinite(pt.pm2_5)
              ? Number(Math.max(0, pt.pm2_5).toFixed(1))
              : '—';
            const advice = getHourlyAdvice(aqi);

            return (
              <tr key={`${pt.time}-${idx}`} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <th scope="row" className="p-2.5 font-medium text-neutral-900 dark:text-neutral-100">
                  {timeLabel}
                </th>
                <td className="p-2.5 font-bold text-neutral-900 dark:text-neutral-50">{aqi}</td>
                <td className="p-2.5">{pt.category}</td>
                <td className="p-2.5">{pm25}</td>
                <td className="p-2.5 text-neutral-600 dark:text-neutral-400">{advice}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
