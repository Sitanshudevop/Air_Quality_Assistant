// Root application component integrating shell landmarks, mode, theme, and features.
import { useState, useEffect, type ReactElement } from 'react';
import { ModeProvider, useMode } from './state/ModeContext.js';
import { SkipLink } from './components/ui/SkipLink.js';
import { Badge } from './components/ui/Badge.js';
import { DemoBanner } from './components/layout/DemoBanner.js';
import { AppHeader } from './components/layout/AppHeader.js';
import { AppFooter } from './components/layout/AppFooter.js';
import { WelcomeCard } from './features/onboarding/WelcomeCard.js';
import { GuidedTour } from './features/onboarding/GuidedTour.js';
import { ProfileWizard } from './features/onboarding/ProfileWizard.js';
import { TodayDashboard } from './features/dashboard/TodayDashboard.js';
import { HourlyOutlook } from './features/outlook/HourlyOutlook.js';
import { DEMO_SNAPSHOTS } from './constants/demo/snapshots.js';
import type { Provenance } from '../shared/types.js';

const initialProvenance: Provenance = { source: 'rules', model: 'rules-v1', cached: false };

function AppShell(): ReactElement {
  const { mode, toggleMode, isDemo, setMode } = useMode();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [configured, setConfigured] = useState<boolean | null>(null);

  const activeSnapshot = DEMO_SNAPSHOTS.delhi;

  useEffect(() => {
    fetch('/api/ai-status')
      .then((res) => (res.ok ? res.json() : { configured: false }))
      .then((data: { configured: boolean }) => setConfigured(data.configured))
      .catch(() => setConfigured(false));
  }, []);

  const handleToggleTheme = (): void => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
  };

  const handleLaunchDemo = (): void => {
    setMode('demo');
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50 font-sans p-4 sm:p-6 transition-colors">
      <SkipLink targetId="#main-content" />
      <DemoBanner isDemo={isDemo} />
      <AppHeader
        mode={mode}
        onToggleMode={toggleMode}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onOpenTour={() => setIsTourOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto space-y-6 focus:outline-none">
        <WelcomeCard
          onLaunchDemo={handleLaunchDemo}
          onOpenProfile={() => setIsProfileOpen(true)}
          onStartTour={() => setIsTourOpen(true)}
        />

        <TodayDashboard
          cityName={activeSnapshot.cityName}
          aqi={activeSnapshot.aqi}
          category={activeSnapshot.category}
          dominantPollutant={activeSnapshot.dominantPollutant}
          pollutants={activeSnapshot.pollutants}
          weatherFactors={activeSnapshot.weather}
          sourceLabel={isDemo ? 'Curated Demo Snapshot (Delhi)' : 'Open-Meteo Air Quality API'}
        />

        <HourlyOutlook points={activeSnapshot.hourlyAirQuality} />

        <section aria-labelledby="status-heading" className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <h2 id="status-heading" className="text-base font-semibold mb-2">Service Status</h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            AI Assistant Service:{' '}
            <span className="font-semibold" data-testid="ai-status">
              {configured === null ? 'Checking...' : configured ? 'Ready' : 'Offline (Rules Active)'}
            </span>
          </p>
        </section>

        <section aria-labelledby="tips-heading" className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="tips-heading" className="text-base font-semibold">Daily Indoor Protection Tips</h2>
            <Badge provenance={initialProvenance} />
          </div>
          <ul className="list-disc list-inside text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
            <li>Keep windows sealed between 6:00 AM and 10:00 AM during peak inversion.</li>
            <li>Use damp mop instead of sweeping to avoid aerosolizing settled particulate matter.</li>
            <li>Run air purifier on medium/high speed in living spaces.</li>
          </ul>
        </section>
      </main>

      <AppFooter />

      <GuidedTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
      <ProfileWizard isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}

/**
 * Root application component wrapping state providers.
 *
 * @returns React application element.
 */
export function App(): ReactElement {
  return (
    <ModeProvider>
      <AppShell />
    </ModeProvider>
  );
}
