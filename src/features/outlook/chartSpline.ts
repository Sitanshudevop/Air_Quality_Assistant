// Monotone-style smooth cubic Bezier spline and area path builders for inline SVG charts.
import type { SvgPoint } from './outlookUtils.js';

/**
 * Generates a smooth cubic Bezier SVG path string through the given coordinates.
 *
 * @param coords - Ordered SVG coordinate points.
 * @returns SVG path `d` attribute string.
 */
export function buildSmoothCurvePath(coords: readonly SvgPoint[]): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M ${coords[0].x},${coords[0].y}`;

  const parts: string[] = [`M ${coords[0].x},${coords[0].y}`];
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    parts.push(`C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x},${p2.y}`);
  }
  return parts.join(' ');
}

/**
 * Generates a closed SVG area path below the smooth curve down to the chart baseline.
 *
 * @param coords - Ordered SVG coordinate points.
 * @param baselineY - Y coordinate of the chart bottom axis.
 * @returns Closed SVG path `d` attribute string.
 */
export function buildSmoothAreaPath(coords: readonly SvgPoint[], baselineY: number): string {
  if (coords.length === 0) return '';
  const curve = buildSmoothCurvePath(coords);
  const last = coords[coords.length - 1];
  const first = coords[0];
  return `${curve} L ${last.x},${baselineY} L ${first.x},${baselineY} Z`;
}

/**
 * Returns badge color classes for an AQI category label.
 *
 * @param category - CPCB AQI category string.
 * @returns Tailwind background and text classes.
 */
export function categoryPillClass(category: string): string {
  switch (category) {
    case 'Good':
    case 'Satisfactory':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    case 'Moderate':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
    case 'Poor':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300';
    default:
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
  }
}
