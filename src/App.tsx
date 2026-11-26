// Root application component integrating shell landmarks, providers, tabs, and lazy views.
import { lazy, Suspense, useEffect, useState, type ReactElement } from 'react';
import { ModeProvider, useMode } from './state/ModeContext.js';
import { LanguageProvider } from './state/language.js';
import { resolveActiveConditions, resolveEffectiveProfile } from './state/activeConditions.js';
import type { DemoCityId, DemoPersonaId } from './constants/demo/types.js';
import { generateRoutine } from './domain/routine.js';
import type { ManualAirQualityData } from './services/manualReading.js';
import type { AirQualityData, ForecastData } from './services/openMeteo.types.js';
import { SkipLink } from './components/ui/SkipLink.js';
import { DemoBanner } from './components/layout/DemoBanner.js';
import { AppHeader } from './components/layout/AppHeader.js';
import { AppFooter } from './components/layout/AppFooter.js';
import { FeatureTabs, type FeatureTabId } from './components/layout/FeatureTabs.js';
import { LocationBar } from './components/layout/LocationBar.js';
import { WelcomeCard } from './features/onboarding/WelcomeCard.js';
import { TodayDashboard } from './features/dashboard/TodayDashboard.js';
import { PrintPlan } from './features/print/PrintPlan.js';
import { mapStoredProfileToDomain } from './features/routine/routineUtils.js';
import { checkAiStatus } from './services/ai.js';

const GuidedTour = lazy(() => import('./features/onboarding/GuidedTour.js').then((m) => ({ default: m.GuidedTour })));
const ProfileWizard = lazy(() => import('./features/onboarding/ProfileWizard.js').then((m) => ({ default: m.ProfileWizard })));
const HourlyOutlook = lazy(() => import('./features/outlook/HourlyOutlook.js').then((m) => ({ default: m.HourlyOutlook })));
const RoutineView = lazy(() => import('./features/routine/RoutineView.js').then((m) => ({ default: m.RoutineView })));
const IndoorView = lazy(() => import('./features/indoor/IndoorView.js').then((m) => ({ default: m.IndoorView })));
const ImpactView = lazy(() => import('./features/impact/ImpactView.js').then((m) => ({ default: m.ImpactView })));
const ChatView = lazy(() => import('./features/assistant/ChatView.js').then((m) => ({ default: m.ChatView })));
const CommunityKitView = lazy(() => import('./features/community/CommunityKitView.js').then((m) => ({ default: m.CommunityKitView })));

function schedulePostPaint(task: () => void): () => void {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(task);
    return () => window.cancelIdleCallback(id);
  }
  const timer = setTimeout(task, 0);
  return () => clearTimeout(timer);
}

function useAiServiceStatus(): boolean | null {
  const [configured, setConfigured] = useState<boolean | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const cancelSchedule = schedulePostPaint(() => {
      void checkAiStatus(controller.signal).then((data) => {
        if (!controller.signal.aborted) setConfigured(data.configured);
      });
    });
    return () => {
      cancelSchedule();
      controller.abort();
    };
  }, []);
  return configured;
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

function AiStatusCard({ configured }: { configured: boolean | null }): ReactElement {
  return (
    <section aria-labelledby="status-heading" className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">
      <h2 id="status-heading" className="text-base font-semibold mb-2">Service Status</h2>
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        AI Assistant Service:{' '}
        <span className="font-semibold" data-testid="ai-status">
          {configured === null ? 'Checking...' : configured ? 'Ready' : 'Offline (Rules Active)'}
        </span>
      </p>
    </section>
  );
}

function AppShell(): ReactElement {
  const { mode, toggleMode, isDemo, setMode } = useMode();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const configured = useAiServiceStatus();
  const [activeTab, setActiveTab] = useState<FeatureTabId>('today');
  const [demoCityId, setDemoCityId] = useState<DemoCityId>('delhi');
  const [demoPersonaId, setDemoPersonaId] = useState<DemoPersonaId>('toddler_grandparent');
  const [liveData, setLiveData] = useState<{ aq: AirQualityData; label: string } | null>(null);
  const [liveForecast, setLiveForecast] = useState<ForecastData | null>(null);
  const [manualData, setManualData] = useState<ManualAirQualityData | null>(null);

  const conditions = resolveActiveConditions({ isDemo, demoCityId, liveData, liveForecast, manualData });
  const profile = resolveEffectiveProfile(isDemo, demoPersonaId);
  const domainProfile = mapStoredProfileToDomain(profile);
  const routineItems = generateRoutine(conditions.category, domainProfile);

  const handleToggleTheme = (): void => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50 font-sans p-4 sm:p-6 transition-colors">
      <SkipLink targetId="#main-content" />
      <DemoBanner isDemo={isDemo} />
      <AppHeader mode={mode} onToggleMode={toggleMode} isDark={isDark} onToggleTheme={handleToggleTheme} onOpenTour={() => setIsTourOpen(true)} onOpenProfile={() => setIsProfileOpen(true)} />

      <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto space-y-6 focus:outline-none">
        <WelcomeCard onLaunchDemo={() => setMode('demo')} onOpenProfile={() => setIsProfileOpen(true)} onStartTour={() => setIsTourOpen(true)} />
        <LocationBar
          isDemo={isDemo}
          demoCityId={demoCityId}
          demoPersonaId={demoPersonaId}
          onSelectDemoCity={setDemoCityId}
          onSelectDemoPersona={setDemoPersonaId}
          onLiveData={(aq, fc, label) => { setLiveData({ aq, label }); setLiveForecast(fc); setManualData(null); }}
          onManualReading={(reading) => setManualData(reading)}
        />
        <FeatureTabs activeTab={activeTab} onSelectTab={setActiveTab} />

        <div id={`tabpanel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="space-y-6">
          {activeTab === 'today' && (
            <>
              <TodayDashboard cityName={conditions.cityName} aqi={conditions.aqi} category={conditions.category} dominantPollutant={conditions.dominantPollutant} pollutants={conditions.pollutants} weatherFactors={conditions.weatherFactors} sourceLabel={conditions.sourceLabel} />
              <Suspense fallback={<p className="p-4 text-xs">Loading outlook...</p>}>
                <HourlyOutlook points={conditions.hourlyPoints} />
              </Suspense>
              <AiStatusCard configured={configured} />
              <PrintPlan cityName={conditions.cityName} aqi={conditions.aqi} category={conditions.category} routineItems={routineItems} />
            </>
          )}
          <Suspense fallback={<p className="p-4 text-xs">Loading section...</p>}>
            {activeTab === 'routine' && <RoutineView aqi={conditions.aqi} category={conditions.category} cityName={conditions.cityName} profile={profile} />}
            {activeTab === 'indoor' && <IndoorView aqi={conditions.aqi} cityName={conditions.cityName} />}
            {activeTab === 'impact' && <ImpactView aqi={conditions.aqi} pm25={conditions.pm25} cityName={conditions.cityName} vulnerability={domainProfile.vulnerability} />}
            {activeTab === 'assistant' && <ChatView aqi={conditions.aqi} category={conditions.category} cityName={conditions.cityName} />}
            {activeTab === 'community' && <CommunityKitView aqi={conditions.aqi} category={conditions.category} cityName={conditions.cityName} />}
          </Suspense>
        </div>
      </main>

      <AppFooter />
      <AppModals isTourOpen={isTourOpen} isProfileOpen={isProfileOpen} onCloseTour={() => setIsTourOpen(false)} onCloseProfile={() => setIsProfileOpen(false)} />
    </div>
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
