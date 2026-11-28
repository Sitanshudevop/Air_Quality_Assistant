// Minimalist flowing S + leaf Saans emblem rendered as a crisp, zero-network inline SVG.
import type { ReactElement } from 'react';

/** Props for SaansLogo component. */
export interface SaansLogoProps {
  readonly className?: string;
}

/** Inline SVG matching the mint-green to ocean-teal flowing S + leaf emblem. */
function SaansLogoSvg(): ReactElement {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="saansLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="55%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#F8FAFC" />
      <path
        d="M39 16 C27 12 21 20 25 27 C29 33 41 34 40 43 C39 50 28 52 17 45 C26 48 33 46 34 41 C35 36 23 35 20 27 C17 19 25 9 39 16 Z"
        fill="url(#saansLogoGrad)"
      />
      <path
        d="M33 21 C38 17 45 17 48 16 C47 22 42 26 35 24 Z"
        fill="url(#saansLogoGrad)"
      />
    </svg>
  );
}

/**
 * Renders the circular Saans S + leaf brand emblem inline without network image requests.
 *
 * @param props - Optional wrapper styling.
 * @returns Circular logo element.
 */
export function SaansLogo({ className = '' }: SaansLogoProps): ReactElement {
  return (
    <div
      aria-hidden="true"
      className={`w-11 h-11 rounded-full overflow-hidden shadow-sm bg-white flex items-center justify-center shrink-0 ${className}`.trim()}
    >
      <SaansLogoSvg />
    </div>
  );
}
