// Root application component integrating BentoShell, providers, tabs, and lazy views.
import { lazy, Suspense, useEffect, useState, type ReactElement } from 'react';
import { ModeProvider, useMode } from './state/ModeContext.js';
import { LanguageProvider, useLanguage } from './state/language.js';
import { resolveActiveConditions, resolveEffectiveProfile } from './state/activeConditions.js';
import type { DemoCityId, DemoPersonaId } from './constants/demo/types.js';
import { generateRoutine } from './domain/routine.js';
import type { ManualAirQualityData } from './services/manualReading.js';
import type { AirQualityData, ForecastData } from './services/openMeteo.types.js';
import { SkipLink } from './components/ui/SkipLink.js';
import { DemoBanner } from './components/layout/DemoBanner.js';
import { BentoShell } from './components/layout/BentoShell.js';
import { AppFooter } from './components/layout/AppFooter.js';
import { FeatureTabs, type FeatureTabId } from './components/layout/FeatureTabs.js';
import { LocationBar } from './components/layout/LocationBar.js';
import { AppTabPanels } from './components/layout/AppTabPanels.js';
import { WelcomeRibbon } from './features/onboarding/WelcomeRibbon.js';
import { mapStoredProfileToDomain } from './features/routine/routineUtils.js';
import { checkAiStatus } from './services/ai.js';

const GuidedTour = lazy(() => import('./features/onboarding/GuidedTour.js').then((m) => ({ default: m.GuidedTour })));
const ProfileWizard = lazy(() => import('./features/onboarding/ProfileWizard.js').then((m) => ({ default: m.ProfileWizard })));

function schedulePostPaint(task: () => void): () => void {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(task);
    return () => window.cancelIdleCallback(id);
  }
  const timer = setTimeout(task, 0);
  return () => clearTimeout(timer);
}

function AppModals(props: {
  isTourOpen: boolean;
  isProfileOpen: boolean;
  onCloseTour: () => void;
  onCloseProfile: () => void;
}): ReactElement {
  return (
    <Suspense fallback={null}>
      {props.isTourOpen && <GuidedTour isOpen={props.isTourOpen} onClose={props.onCloseTour} />}
      {props.isProfileOpen && <ProfileWizard isOpen={props.isProfileOpen} onClose={props.onCloseProfile} />}
    </Suspense>
  );
}

function useAppState(opts: {
  isDemo: boolean;
  demoCityId: DemoCityId;
  demoPersonaId: DemoPersonaId;
  liveData: { aq: AirQualityData; label: string } | null;
  liveForecast: ForecastData | null;
  manualData: ManualAirQualityData | null;
}): { conditions: ReturnType<typeof resolveActiveConditions>; profile: ReturnType<typeof resolveEffectiveProfile>; domainProfile: ReturnType<typeof mapStoredProfileToDomain>; routineItems: ReturnType<typeof generateRoutine> } {
  const conditions = resolveActiveConditions(opts);
  const profile = resolveEffectiveProfile(opts.isDemo, opts.demoPersonaId);
  const domainProfile = mapStoredProfileToDomain(profile);
  const routineItems = conditions.category ? generateRoutine(conditions.category, domainProfile) : [];
  return { conditions, profile, domainProfile, routineItems };
}

function AppShell(): ReactElement {
  const { mode, toggleMode, isDemo, setMode } = useMode();
  const { toggleLanguage } = useLanguage();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<FeatureTabId>('today');
  const [demoCityId, setDemoCityId] = useState<DemoCityId>('delhi');
  const [demoPersonaId, setDemoPersonaId] = useState<DemoPersonaId>('toddler_grandparent');
  const [liveData, setLiveData] = useState<{ aq: AirQualityData; label: string } | null>(null);
  const [liveForecast, setLiveForecast] = useState<ForecastData | null>(null);
  const [manualData, setManualData] = useState<ManualAirQualityData | null>(null);
  const [profileVer, setProfileVer] = useState<number>(0);

  useEffect(() => {
    const controller = new AbortController();
    const cancel = schedulePostPaint(() => { void checkAiStatus(controller.signal); });
    return () => { cancel(); controller.abort(); };
  }, []);

  const { conditions, profile, domainProfile, routineItems } = useAppState({ isDemo, demoCityId, demoPersonaId, liveData, liveForecast, manualData });
  const handleToggleTheme = (): void => { const n = !isDark; setIsDark(n); document.documentElement.classList.toggle('dark', n); };
  const focusSearch = (): void => { document.getElementById('live-city-search')?.focus(); };
  const headerProps = {
    mode, onToggleMode: toggleMode, cityName: conditions.cityName, category: conditions.category,
    onSearchCity: (q: string) => { const el = document.getElementById('live-city-search') as HTMLInputElement | null; if (el) { el.value = q; el.dispatchEvent(new Event('input', { bubbles: true })); } focusSearch(); },
    onUseLocation: () => { document.getElementById('use-location-btn')?.click(); },
    onLaunchDemo: () => setMode('demo'),
  };

  return (
    <>
      <SkipLink targetId="#main-content" />
      <DemoBanner isDemo={isDemo} />
      <BentoShell activeTab={activeTab} onSelectTab={setActiveTab} isDark={isDark} onToggleTheme={handleToggleTheme} onToggleLang={toggleLanguage} onOpenTour={() => setIsTourOpen(true)} onOpenProfile={() => setIsProfileOpen(true)} headerProps={headerProps}>
        <main id="main-content" tabIndex={-1} className="space-y-5 focus:outline-none pt-2">
          <WelcomeRibbon onLaunchDemo={() => setMode('demo')} onOpenProfile={() => setIsProfileOpen(true)} onStartTour={() => setIsTourOpen(true)} />
          <LocationBar isDemo={isDemo} demoCityId={demoCityId} demoPersonaId={demoPersonaId} onSelectDemoCity={setDemoCityId} onSelectDemoPersona={setDemoPersonaId} onLiveData={(aq, fc, label) => { setLiveData({ aq, label }); setLiveForecast(fc); setManualData(null); }} onManualReading={(reading) => setManualData(reading)} />
          <FeatureTabs activeTab={activeTab} onSelectTab={setActiveTab} />
          <AppTabPanels key={`panel-${profileVer}`} activeTab={activeTab} conditions={conditions} profile={profile} domainProfile={domainProfile} routineItems={routineItems} onLaunchDemo={() => setMode('demo')} onFocusSearch={focusSearch} onProfileUpdated={() => setProfileVer((v) => v + 1)} />
        </main>
      </BentoShell>
      <AppFooter />
      <AppModals isTourOpen={isTourOpen} isProfileOpen={isProfileOpen} onCloseTour={() => setIsTourOpen(false)} onCloseProfile={() => setIsProfileOpen(false)} />
    </>
  );
}

/**
 * Root application component wrapping mode and language providers.
 *
 * @returns React application element.
 */
export function App(): ReactElement {
  return (
    <LanguageProvider>
      <ModeProvider>
        <AppShell />
      </ModeProvider>
    </LanguageProvider>
  );
}
