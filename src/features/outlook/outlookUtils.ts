// Coordinate scaling, polyline generation, and activity window detection for hourly outlook.
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';

export const CHART_WIDTH = 800;
export const CHART_HEIGHT = 240;
export const PADDING = { left: 45, right: 20, top: 20, bottom: 30 };
export const MAX_AQI = 500;

/** Computed SVG coordinates for an hourly forecast point. */
export interface SvgPoint {
  x: number;
  y: number;
  aqi: number;
  timeLabel: string;
  category: string;
}

/** Time window recommendation for outdoor activity or ventilation. */
export interface ActivityWindow {
  hourLabel: string;
  aqi: number;
  advice: string;
}

/**
 * Extracts clean 2-digit hour from an ISO datetime string.
 *
 * @param timeStr - ISO timestamp or time string.
 * @returns Formatted hour string (e.g. "14:00").
 */
export function formatHour(timeStr: string): string {
  if (!timeStr) return '00:00';
  const match = timeStr.match(/T(\d{2}:\d{2})/);
  if (match) return match[1] ?? '00:00';
  const parts = timeStr.split(':');
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return timeStr;
}

/**
 * Scales an array of hourly points into SVG coordinate space.
 *
 * @param points - Hourly air quality forecast points.
 * @returns Array of calculated SVG point positions.
 */
export function computeSvgCoordinates(
  points: readonly HourlyAirQualityPoint[]
): SvgPoint[] {
  if (points.length === 0) return [];

  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const divisor = Math.max(1, points.length - 1);

  return points.map((p, idx) => {
    const safeAqi = Math.max(0, Math.min(MAX_AQI, p.aqi));
    const x = Math.round(PADDING.left + (idx / divisor) * plotWidth);
    const y = Math.round(PADDING.top + (1 - safeAqi / MAX_AQI) * plotHeight);
    return {
      x,
      y,
      aqi: safeAqi,
      timeLabel: formatHour(p.time),
      category: p.category,
    };
  });
}

/**
 * Generates an SVG polyline points string from hourly air quality points.
 *
 * @param points - Hourly forecast points.
 * @returns String formatted as "x1,y1 x2,y2 ...".
 */
export function generatePolylinePoints(
  points: readonly HourlyAirQualityPoint[]
): string {
  const coords = computeSvgCoordinates(points);
  return coords.map((c) => `${c.x},${c.y}`).join(' ');
}

/**
 * Identifies the best outdoor/ventilation window and peak inversion window.
 *
 * @param points - Hourly forecast points.
 * @returns Best and worst activity windows.
 */
export function findActivityWindows(
  points: readonly HourlyAirQualityPoint[]
): { best: ActivityWindow; worst: ActivityWindow } {
  if (points.length === 0) {
    return {
      best: { hourLabel: '14:00', aqi: 150, advice: 'Afternoon solar mixing window' },
      worst: { hourLabel: '07:00', aqi: 450, advice: 'Peak nocturnal inversion window' },
    };
  }

  let minPoint = points[0] ?? { aqi: 0, time: '' };
  let maxPoint = points[0] ?? { aqi: 500, time: '' };

  for (const pt of points) {
    if (pt.aqi < minPoint.aqi) minPoint = pt;
    if (pt.aqi > maxPoint.aqi) maxPoint = pt;
  }

  return {
    best: {
      hourLabel: formatHour(minPoint.time),
      aqi: Math.round(minPoint.aqi),
      advice: 'Lowest particulate concentration; safest window for brief room flush.',
    },
    worst: {
      hourLabel: formatHour(maxPoint.time),
      aqi: Math.round(maxPoint.aqi),
      advice: 'Peak particulate stagnation; keep windows sealed and air purifier on.',
    },
  };
}
