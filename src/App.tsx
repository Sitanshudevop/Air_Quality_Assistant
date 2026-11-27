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
import type { FeatureTabId } from './components/layout/FeatureTabs.js';
import { LocationBar } from './components/layout/LocationBar.js';
import { useLiveLocation } from './components/layout/useLiveLocation.js';
import { AppTabPanels } from './components/layout/AppTabPanels.js';
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
  isTourOpen: boolean; isProfileOpen: boolean;
  onCloseTour: () => void; onCloseProfile: () => void;
}): ReactElement {
  return (
    <Suspense fallback={null}>
      {props.isTourOpen && <GuidedTour isOpen={props.isTourOpen} onClose={props.onCloseTour} />}
      {props.isProfileOpen && <ProfileWizard isOpen={props.isProfileOpen} onClose={props.onCloseProfile} />}
    </Suspense>
  );
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

  const liveState = useLiveLocation({
    onLiveData: (aq, fc, label) => { setLiveData({ aq, label }); setLiveForecast(fc); setManualData(null); },
    onManualReading: (reading) => setManualData(reading),
    onSwitchToLive: () => { if (isDemo) setMode('live'); },
  });

  const conditions = resolveActiveConditions({ isDemo, demoCityId, liveData, liveForecast, manualData });
  const profile = resolveEffectiveProfile(isDemo, demoPersonaId);
  const domainProfile = mapStoredProfileToDomain(profile);
  const routineItems = conditions.category ? generateRoutine(conditions.category, domainProfile) : [];
  const handleToggleTheme = (): void => { const n = !isDark; setIsDark(n); document.documentElement.classList.toggle('dark', n); };
  const focusSearch = (): void => { document.getElementById('live-city-search')?.focus(); };

  return (
    <>
      <SkipLink targetId="#main-content" />
      <DemoBanner isDemo={isDemo} />
      <BentoShell
        activeTab={activeTab} onSelectTab={setActiveTab} isDark={isDark} onToggleTheme={handleToggleTheme}
        onToggleLang={toggleLanguage} onOpenTour={() => setIsTourOpen(true)} onOpenProfile={() => setIsProfileOpen(true)}
        headerProps={{
          mode, onToggleMode: toggleMode, cityName: conditions.cityName, category: conditions.category,
          searchQuery: liveState.query, isLocating: liveState.isLocating, onSearchChange: liveState.onQueryChange,
          onSearchSubmit: liveState.onSearchSubmit, onUseLocation: liveState.onGeo, onToggleManual: liveState.onToggleManual,
        }}
      >
        <main id="main-content" tabIndex={-1} className="flex flex-col gap-5 focus:outline-none">
          <LocationBar
            isDemo={isDemo} demoCityId={demoCityId} demoPersonaId={demoPersonaId}
            onSelectDemoCity={setDemoCityId} onSelectDemoPersona={setDemoPersonaId}
            onLiveData={(aq, fc, label) => { setLiveData({ aq, label }); setLiveForecast(fc); setManualData(null); }}
            onManualReading={(reading) => setManualData(reading)} liveState={liveState}
          />
          <AppTabPanels
            key={`panel-${profileVer}`} activeTab={activeTab} conditions={conditions} profile={profile}
            domainProfile={domainProfile} routineItems={routineItems}
            onLaunchDemo={() => setMode('demo')} onFocusSearch={focusSearch}
            onUseLocation={liveState.onGeo} onManualReading={liveState.onToggleManual}
            onProfileUpdated={() => setProfileVer((v) => v + 1)}
          />
        </main>
        <AppFooter />
      </BentoShell>
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
    <LanguageProvider><ModeProvider><AppShell /></ModeProvider></LanguageProvider>
  );
}
