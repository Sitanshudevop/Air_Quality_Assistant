// Welcome card presenting 1-click demo, profile setup, and guided tour triggers.
import type { ReactElement } from 'react';
import { Button } from '../../components/ui/Button.js';

/** Props for WelcomeCard component. */
export interface WelcomeCardProps {
  onLaunchDemo: () => void;
  onOpenProfile: () => void;
  onStartTour: () => void;
  className?: string;
}

/**
 * Welcoming hero card giving first-time users rapid access to demo data, setup, and tour.
 *
 * @param props - Navigation and action callback handlers.
 * @returns React component element.
 */
export function WelcomeCard({
  onLaunchDemo,
  onOpenProfile,
  onStartTour,
  className = '',
}: WelcomeCardProps): ReactElement {
  return (
    <section
      aria-labelledby="welcome-title"
      className={`p-6 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm text-neutral-900 dark:text-neutral-50 ${className}`.trim()}
    >
      <div className="max-w-2xl">
        <h2 id="welcome-title" className="text-2xl font-bold tracking-tight">
          Welcome to Saans (सांस)
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Personalized, science-backed guidance to protect your household during North Indian winter
          smog. Grounded CPCB AQI estimates, weather mixing alerts, and actionable low-emission
          routines.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={onLaunchDemo}>
          1-Click Demo Launch
        </Button>
        <Button variant="secondary" onClick={onOpenProfile}>
          Set Up Family Profile
        </Button>
        <Button variant="outline" onClick={onStartTour}>
          Guided Tour
        </Button>
      </div>
    </section>
  );
}
