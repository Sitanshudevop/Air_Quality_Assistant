// Responsive inline SVG city skyline with dynamic atmospheric haze layer tied to AQI band.
import type { ReactElement } from 'react';
import type { AqiCategory } from '../../domain/types.js';

/** Props for CitySkylineSvg component. */
export interface CitySkylineSvgProps {
  readonly category?: AqiCategory;
  readonly aqi?: number;
  readonly className?: string;
}

function getHazeOpacity(category?: AqiCategory): number {
  switch (category) {
    case 'Good': return 0.05;
    case 'Satisfactory': return 0.12;
    case 'Moderate': return 0.28;
    case 'Poor': return 0.48;
    case 'Very Poor': return 0.65;
    case 'Severe': return 0.82;
    default: return 0.15;
  }
}

function getHazeTint(category?: AqiCategory): string {
  if (category === 'Severe' || category === 'Very Poor') return '#78350f';
  if (category === 'Poor' || category === 'Moderate') return '#b45309';
  return '#94a3b8';
}

/**
 * Original inline SVG architectural cityscape illustration with adaptive particulate haze filter.
 *
 * @param props - Current AQI category and container styling.
 * @returns Accessible inline SVG element carrying aria-hidden.
 */
export function CitySkylineSvg({ category, aqi, className = '' }: CitySkylineSvgProps): ReactElement {
  const hazeOpacity = getHazeOpacity(category);
  const hazeColor = getHazeTint(category);

  return (
    <div
      aria-hidden="true"
      className={`relative w-full h-40 sm:h-52 rounded-[24px] overflow-hidden bg-gradient-to-b from-sky-100/60 via-teal-50/40 to-white dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-950 border border-neutral-200/80 dark:border-neutral-800 ${className}`.trim()}
    >
      <svg
        viewBox="0 0 1000 300"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 w-full h-full"
      >
        {/* Soft background sun / moon */}
        <circle cx="820" cy="80" r="45" fill="#fde047" opacity="0.4" />

        {/* Distant building silhouette */}
        <g fill="#cbd5e1" className="dark:fill-neutral-700 opacity-60">
          <rect x="80" y="140" width="60" height="160" rx="4" />
          <rect x="160" y="100" width="75" height="200" rx="4" />
          <polygon points="197,60 170,100 225,100" />
          <rect x="250" y="160" width="80" height="140" rx="4" />
          <rect x="420" y="110" width="110" height="190" rx="4" />
          <rect x="560" y="150" width="70" height="150" rx="4" />
          <rect x="650" y="80" width="90" height="220" rx="4" />
          <polygon points="695,45 660,80 730,80" />
          <rect x="760" y="130" width="120" height="170" rx="4" />
        </g>

        {/* Foreground landmark structures & skyline */}
        <g fill="#94a3b8" className="dark:fill-neutral-600">
          <rect x="30" y="190" width="90" height="110" rx="6" />
          <rect x="340" y="170" width="70" height="130" rx="6" />
          {/* Monument gateway silhouette */}
          <path d="M 460 300 L 460 210 Q 500 190 540 210 L 540 300 L 515 300 L 515 240 Q 500 230 485 240 L 485 300 Z" />
          <rect x="550" y="180" width="85" height="120" rx="6" />
          <rect x="850" y="170" width="110" height="130" rx="6" />
        </g>

        {/* Particulate Smog / Haze Layer */}
        <rect
          x="0"
          y="0"
          width="1000"
          height="300"
          fill={hazeColor}
          opacity={hazeOpacity}
          style={{ transition: 'opacity 300ms ease, fill 300ms ease' }}
        />
      </svg>
      {aqi !== undefined && (
        <span className="sr-only">Visual skyline illustrating air haze for AQI {aqi}</span>
      )}
    </div>
  );
}
