// Pure inline accessible SVG smooth area chart with interactive floating hover tooltip.
import { useState, type ReactElement } from 'react';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';
import {
  CHART_WIDTH,
  CHART_HEIGHT,
  PADDING,
  computeSvgCoordinates,
  getOutlookSummary,
  type SvgPoint,
} from './outlookUtils.js';
import { buildSmoothAreaPath, buildSmoothCurvePath, categoryPillClass } from './chartSpline.js';

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

function FloatingTooltip({ point }: { point: SvgPoint }): ReactElement {
  const leftPct = Math.min(78, Math.max(22, (point.x / CHART_WIDTH) * 100));
  return (
    <div
      role="status"
      style={{ left: `${leftPct}%`, top: '8px', transform: 'translateX(-50%)' }}
      className="pointer-events-none absolute z-10 flex items-center gap-2 rounded-2xl bg-white dark:bg-neutral-800 px-3 py-1.5 shadow-lg text-xs whitespace-nowrap"
    >
      <span className="font-semibold text-bento-muted dark:text-neutral-400">{point.timeLabel}</span>
      <span className="font-extrabold text-bento-ink dark:text-white">AQI {point.aqi}</span>
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${categoryPillClass(point.category)}`}>
        {point.category}
      </span>
    </div>
  );
}

function WindowHighlights({ coords, baseY }: { coords: readonly SvgPoint[]; baseY: number }): ReactElement | null {
  if (coords.length < 2) return null;
  let minPt = coords[0];
  let maxPt = coords[0];
  for (const c of coords) {
    if (c.aqi < minPt.aqi) minPt = c;
    if (c.aqi > maxPt.aqi) maxPt = c;
  }
  const h = baseY - PADDING.top;
  return (
    <>
      <rect x={Math.max(PADDING.left, minPt.x - 14)} y={PADDING.top} width="28" height={h} rx="6" fill="#10B981" opacity="0.10" />
      <rect x={Math.max(PADDING.left, maxPt.x - 14)} y={PADDING.top} width="28" height={h} rx="6" fill="#E11D48" opacity="0.10" />
    </>
  );
}

/**
 * Pure inline SVG smooth spline area chart presenting 24-48h air quality trends.
 *
 * @param props - Hourly forecast data points and optional styling.
 * @returns React component element.
 */
export function AccessibleSvgChart({ points, className = '' }: AccessibleSvgChartProps): ReactElement {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const coords = computeSvgCoordinates(points);
  const curvePath = buildSmoothCurvePath(coords);
  const baseY = CHART_HEIGHT - PADDING.bottom;
  const areaPath = buildSmoothAreaPath(coords, baseY);
  const step = Math.max(1, Math.floor(coords.length / 5));
  const summary = getOutlookSummary(points);
  const colW = coords.length > 1 ? (CHART_WIDTH - PADDING.left - PADDING.right) / coords.length : 24;
  const activePt = hoverIdx !== null ? coords[hoverIdx] : undefined;

  return (
    <div className={`relative w-full min-w-0 overflow-hidden ${className}`.trim()} onMouseLeave={() => setHoverIdx(null)}>
      <p className="sr-only" data-testid="chart-text-summary">{summary}</p>
      {activePt && <FloatingTooltip point={activePt} />}

      <svg
        role="img"
        aria-labelledby="chart-title chart-desc"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-[220px] sm:h-[280px] lg:h-[320px]"
      >
        <defs>
          <linearGradient id="saansAqiGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4338CA" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#4338CA" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <title id="chart-title">Next 24 to 48 Hours Air Quality Outlook</title>
        <desc id="chart-desc">{summary}</desc>

        {GRID_LEVELS.map((g) => (
          <g key={g.aqi}>
            <line x1={PADDING.left} y1={g.y} x2={CHART_WIDTH - PADDING.right} y2={g.y} stroke="#E2E8F0" strokeDasharray="4 4" strokeWidth="1" />
            <text x="6" y={g.y + 3} fontSize="10" fill="#94A3B8">{g.label}</text>
          </g>
        ))}

        <WindowHighlights coords={coords} baseY={baseY} />
        {areaPath && <path d={areaPath} fill="url(#saansAqiGrad)" />}
        {curvePath && <path d={curvePath} fill="none" stroke="#4338CA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

        {activePt && (
          <g pointerEvents="none">
            <line x1={activePt.x} y1={PADDING.top} x2={activePt.x} y2={baseY} stroke="#94A3B8" strokeDasharray="3 3" strokeWidth="1.5" />
            <circle cx={activePt.x} cy={activePt.y} r="9" fill="#4338CA" opacity="0.18" />
            <circle cx={activePt.x} cy={activePt.y} r="4.5" fill="#4338CA" stroke="#ffffff" strokeWidth="2" />
          </g>
        )}

        {coords.map((c, i) => (
          <g key={`${c.timeLabel}-${i}`}>
            <rect
              x={c.x - colW / 2}
              y={PADDING.top}
              width={colW}
              height={baseY - PADDING.top}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onFocus={() => setHoverIdx(i)}
              onClick={() => setHoverIdx(i)}
            >
              <title>{`${c.timeLabel}: AQI ${c.aqi} (${c.category})`}</title>
            </rect>
            {i % step === 0 && (
              <text x={c.x - 12} y={CHART_HEIGHT - 8} fontSize="10" fill="#94A3B8">{c.timeLabel}</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
