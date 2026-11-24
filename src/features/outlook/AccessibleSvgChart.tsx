// Pure inline accessible SVG chart plotting hourly AQI with activity window highlights.
import type { ReactElement } from 'react';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';
import {
  CHART_WIDTH,
  CHART_HEIGHT,
  PADDING,
  computeSvgCoordinates,
  generatePolylinePoints,
} from './outlookUtils.js';

/** Props for AccessibleSvgChart component. */
export interface AccessibleSvgChartProps {
  points: readonly HourlyAirQualityPoint[];
  className?: string;
}

const GRID_LEVELS = [
  { aqi: 100, label: '100', y: 172 },
  { aqi: 200, label: '200', y: 134 },
  { aqi: 300, label: '300', y: 96 },
  { aqi: 400, label: '400', y: 58 },
];

/**
 * Pure inline SVG line chart presenting 24-48h air quality trends without external libraries.
 *
 * @param props - Hourly forecast data points and optional styling.
 * @returns React component element.
 */
export function AccessibleSvgChart({
  points,
  className = '',
}: AccessibleSvgChartProps): ReactElement {
  const coords = computeSvgCoordinates(points);
  const polylineStr = generatePolylinePoints(points);
  const step = Math.max(1, Math.floor(coords.length / 6));

  return (
    <div className={`w-full overflow-x-auto ${className}`.trim()}>
      <svg
        role="img"
        aria-labelledby="chart-title chart-desc"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full min-w-[500px] h-auto text-neutral-800 dark:text-neutral-200"
      >
        <title id="chart-title">Next 24 to 48 Hours Air Quality Outlook</title>
        <desc id="chart-desc">
          Line chart illustrating hourly estimated CPCB AQI fluctuations, highlighting best outdoor
          windows and peak inversion hours.
        </desc>

        {/* AQI Reference Grid Lines */}
        {GRID_LEVELS.map((g) => (
          <g key={g.aqi} className="opacity-40">
            <line
              x1={PADDING.left}
              y1={g.y}
              x2={CHART_WIDTH - PADDING.right}
              y2={g.y}
              stroke="currentColor"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <text x="5" y={g.y + 4} fontSize="10" fill="currentColor">
              {g.label}
            </text>
          </g>
        ))}

        {/* AQI Trajectory Polyline */}
        {polylineStr && (
          <polyline
            fill="none"
            stroke="#0284c7"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineStr}
          />
        )}

        {/* Time Axis Labels and Data Markers */}
        {coords.map((c, i) => (
          <g key={`${c.timeLabel}-${i}`}>
            <circle
              cx={c.x}
              cy={c.y}
              r="4"
              fill="#0284c7"
              stroke="#ffffff"
              strokeWidth="1.5"
            >
              <title>{`${c.timeLabel}: AQI ${c.aqi} (${c.category})`}</title>
            </circle>
            {i % step === 0 && (
              <text x={c.x - 12} y={CHART_HEIGHT - 8} fontSize="10" fill="currentColor">
                {c.timeLabel}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
