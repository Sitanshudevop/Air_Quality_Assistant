// WelcomeRibbon: compact dismissible onboarding strip shown until user interacts.
import { useState, type ReactElement } from 'react';
import { X } from 'lucide-react';

/** Props for WelcomeRibbon component. */
export interface WelcomeRibbonProps {
  readonly onLaunchDemo: () => void;
  readonly onOpenProfile: () => void;
  readonly onStartTour: () => void;
}

/**
 * One-line dismissible welcome ribbon with quick action links.
 *
 * @param props - Demo, profile, and tour launch callbacks.
 * @returns React element or null when dismissed.
 */
export function WelcomeRibbon({ onLaunchDemo, onOpenProfile, onStartTour }: WelcomeRibbonProps): ReactElement | null {
  const [dismissed, setDismissed] = useState<boolean>(
    () => sessionStorage.getItem('saans-ribbon-dismissed') === '1',
  );

  if (dismissed) return null;

  const dismiss = (): void => {
    sessionStorage.setItem('saans-ribbon-dismissed', '1');
    setDismissed(true);
  };

  return (
    <div
      role="banner"
      aria-label="Welcome to Saans"
      className="flex flex-wrap items-center justify-between gap-2 px-5 py-2 bg-bento-lavender dark:bg-neutral-800 text-xs text-bento-ink dark:text-white"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold">New here?</span>
        <button type="button" onClick={onLaunchDemo} className="underline font-medium hover:no-underline">
          1-Click Demo
        </button>
        <button type="button" onClick={onOpenProfile} className="underline font-medium hover:no-underline">
          Set Up Profile
        </button>
        <button type="button" onClick={onStartTour} className="underline font-medium hover:no-underline">
          Guided Tour
        </button>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss welcome banner"
        className="p-1 rounded-full hover:bg-bento-ink/10 transition-colors"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
