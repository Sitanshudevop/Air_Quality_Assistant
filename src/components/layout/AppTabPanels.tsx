// Active feature tab panel renderer for Today, Routine, Indoor, Impact, Chat, and Community views.
import { lazy, Suspense, type ReactElement } from 'react';
import type { FeatureTabId } from './FeatureTabs.js';
import type { ActiveConditions } from '../../state/activeConditions.js';
import type { StoredProfile } from '../../services/profile.types.js';
import type { RoutineItem, UserProfile } from '../../domain/types.js';
import type { DemoPersonaId } from '../../constants/demo/types.js';
import type { CommunityTemplateId } from '../../utils/deepLink.js';
import { TodayDashboard } from '../../features/dashboard/TodayDashboard.js';
import { HourlyOutlook } from '../../features/outlook/HourlyOutlook.js';
import { PrintPlan } from '../../features/print/PrintPlan.js';
import { TabEmptyNotice } from '../ui/TabEmptyNotice.js';
import { TabHeader } from './TabHeader.js';

const RoutineView = lazy(() => import('../../features/routine/RoutineView.js').then((m) => ({ default: m.RoutineView })));
const IndoorView = lazy(() => import('../../features/indoor/IndoorView.js').then((m) => ({ default: m.IndoorView })));
const ImpactView = lazy(() => import('../../features/impact/ImpactView.js').then((m) => ({ default: m.ImpactView })));
const ChatView = lazy(() => import('../../features/assistant/ChatView.js').then((m) => ({ default: m.ChatView })));
const CommunityKitView = lazy(() => import('../../features/community/CommunityKitView.js').then((m) => ({ default: m.CommunityKitView })));

/** Props for AppTabPanels component. */
export interface AppTabPanelsProps {
  readonly activeTab: FeatureTabId;
  readonly conditions: ActiveConditions;
  readonly profile: StoredProfile;
  readonly domainProfile: UserProfile;
  readonly routineItems: readonly RoutineItem[];
  readonly demoPersonaId?: DemoPersonaId;
  readonly communityTemplate?: CommunityTemplateId;
  readonly onLaunchDemo: () => void;
  readonly onFocusSearch: () => void;
  readonly onUseLocation?: () => void;
  readonly onManualReading?: () => void;
  readonly onProfileUpdated?: (profile: StoredProfile) => void;
}

function TodayPanel(p: AppTabPanelsProps): ReactElement {
  const { conditions, routineItems, onFocusSearch, onLaunchDemo, onProfileUpdated } = p;
  const showOutlook = conditions.status === 'ready' && conditions.hourlyPoints.length > 0;
  return (
    <>
      <TodayDashboard
        status={conditions.status}
        origin={conditions.origin}
        cityName={conditions.cityName}
        aqi={conditions.aqi}
        category={conditions.category}
        dominantPollutant={conditions.dominantPollutant}
        pollutants={conditions.pollutants}
        weatherFactors={conditions.weatherFactors}
        sourceLabel={conditions.sourceLabel}
        timestamp={conditions.timestamp}
        isEstimate={conditions.isEstimate}
        errorMessage={conditions.errorMessage}
        vulnerability={p.domainProfile.vulnerability}
        hourlyPoints={conditions.hourlyPoints}
        onFocusSearch={onFocusSearch}
        onUseLocation={p.onUseLocation}
        onManualReading={p.onManualReading}
        onLaunchDemo={onLaunchDemo}
        onProfileUpdated={onProfileUpdated}
      />
      {showOutlook && <HourlyOutlook points={conditions.hourlyPoints} />}
      <PrintPlan cityName={conditions.cityName} aqi={conditions.aqi} category={conditions.category} routineItems={routineItems} />
    </>
  );
}

function RoutinePanel(p: AppTabPanelsProps): ReactElement {
  const { conditions, profile, onLaunchDemo, onFocusSearch } = p;
  if (conditions.status === 'ready' && conditions.aqi !== undefined && conditions.category) {
    return (
      <div className="space-y-4">
        <TabHeader breadcrumbCurrent="Daily Routine" title="Daily Routine" subtitle={`8 diurnal blocks for ${conditions.cityName ?? 'your city'} (${conditions.category}, Est. AQI ${conditions.aqi})`} />
        <RoutineView aqi={conditions.aqi} category={conditions.category} cityName={conditions.cityName ?? ''} profile={profile} />
      </div>
    );
  }
  return <TabEmptyNotice tabName="Daily Routine" onLaunchDemo={onLaunchDemo} onFocusSearch={onFocusSearch} />;
}

function IndoorPanel(p: AppTabPanelsProps): ReactElement {
  const { conditions, onLaunchDemo, onFocusSearch } = p;
  if (conditions.status === 'ready' && conditions.aqi !== undefined) {
    return (
      <div className="space-y-4">
        <TabHeader breadcrumbCurrent="Indoor Hacks" title="Indoor Hacks" subtitle="CADR calculations, room ventilation locks, and low-cost purification" />
        <IndoorView aqi={conditions.aqi} cityName={conditions.cityName ?? ''} />
      </div>
    );
  }
  return <TabEmptyNotice tabName="Indoor Hacks" onLaunchDemo={onLaunchDemo} onFocusSearch={onFocusSearch} />;
}

function ImpactPanel(p: AppTabPanelsProps): ReactElement {
  const { conditions, domainProfile, onLaunchDemo, onFocusSearch } = p;
  if (conditions.status === 'ready' && conditions.aqi !== undefined && conditions.pm25 !== undefined) {
    return (
      <div className="space-y-4">
        <TabHeader breadcrumbCurrent="Impact Explainer" title="Impact Explainer" subtitle="Evaluate exposure reductions across travel modes and mask ratings" />
        <ImpactView aqi={conditions.aqi} pm25={conditions.pm25} cityName={conditions.cityName ?? ''} vulnerability={domainProfile.vulnerability} />
      </div>
    );
  }
  return <TabEmptyNotice tabName="Impact Explainer" onLaunchDemo={onLaunchDemo} onFocusSearch={onFocusSearch} />;
}

function ChatPanel(p: AppTabPanelsProps): ReactElement {
  return (
    <div className="space-y-4">
      <TabHeader breadcrumbCurrent="Assistant" title="AI Air Quality Assistant" subtitle="Ask questions on air pollution, health protection, and emergency precautions" />
      <ChatView
        aqi={p.conditions.aqi ?? 0}
        category={p.conditions.category ?? 'Moderate'}
        cityName={p.conditions.cityName ?? 'your city'}
        pollutants={p.conditions.pollutants}
        hourlyPoints={p.conditions.hourlyPoints}
        vulnerability={p.domainProfile.vulnerability}
      />
    </div>
  );
}

function CommunityPanel(p: AppTabPanelsProps): ReactElement {
  const { conditions, onLaunchDemo, onFocusSearch } = p;
  if (conditions.status === 'ready' && conditions.aqi !== undefined && conditions.category) {
    return (
      <div className="space-y-4">
        <TabHeader breadcrumbCurrent="Community Kit" title="Community Kit" subtitle="Posters, awareness templates, and local clean air initiatives" />
        <CommunityKitView
          aqi={conditions.aqi}
          category={conditions.category}
          cityName={conditions.cityName ?? ''}
          template={p.communityTemplate}
          persona={p.demoPersonaId}
        />
      </div>
    );
  }
  return <TabEmptyNotice tabName="Community Kit" onLaunchDemo={onLaunchDemo} onFocusSearch={onFocusSearch} />;
}

const TAB_VIEWS: Record<FeatureTabId, (p: AppTabPanelsProps) => ReactElement> = {
  today: TodayPanel,
  routine: RoutinePanel,
  indoor: IndoorPanel,
  impact: ImpactPanel,
  assistant: ChatPanel,
  community: CommunityPanel,
};

/**
 * Renders the active tab content panel with honest empty state guards for Live mode.
 *
 * @param props - Current tab selection, resolved conditions, user profiles, and action triggers.
 * @returns Tab panel container element.
 */
export function AppTabPanels(props: AppTabPanelsProps): ReactElement {
  const View = TAB_VIEWS[props.activeTab] ?? TodayPanel;
  return (
    <div id={`tabpanel-${props.activeTab}`} role="tabpanel" aria-labelledby={`tab-${props.activeTab}`} className="space-y-6">
      <Suspense fallback={<p className="p-4 text-xs">Loading section...</p>}>
        <View {...props} />
      </Suspense>
    </div>
  );
}
