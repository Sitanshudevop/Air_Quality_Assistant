// Active feature tab panel renderer for Today, Routine, Indoor, Impact, Chat, and Community views.
import { lazy, Suspense, type ReactElement } from 'react';
import type { FeatureTabId } from './FeatureTabs.js';
import type { ActiveConditions } from '../../state/activeConditions.js';
import type { StoredProfile } from '../../services/profile.types.js';
import type { RoutineItem, UserProfile } from '../../domain/types.js';
import { TodayDashboard } from '../../features/dashboard/TodayDashboard.js';
import { PrintPlan } from '../../features/print/PrintPlan.js';
import { TabEmptyNotice } from '../ui/TabEmptyNotice.js';

const HourlyOutlook = lazy(() => import('../../features/outlook/HourlyOutlook.js').then((m) => ({ default: m.HourlyOutlook })));
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
  readonly onLaunchDemo: () => void;
  readonly onFocusSearch: () => void;
}

function TodayPanel(p: AppTabPanelsProps): ReactElement {
  const { conditions, routineItems, onFocusSearch, onLaunchDemo } = p;
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
        onFocusSearch={onFocusSearch}
        onLaunchDemo={onLaunchDemo}
      />
      {showOutlook && (
        <Suspense fallback={<p className="p-4 text-xs">Loading outlook...</p>}>
          <HourlyOutlook points={conditions.hourlyPoints} />
        </Suspense>
      )}
      <PrintPlan cityName={conditions.cityName} aqi={conditions.aqi} category={conditions.category} routineItems={routineItems} />
    </>
  );
}

function RoutinePanel(p: AppTabPanelsProps): ReactElement {
  const { conditions, profile, onLaunchDemo, onFocusSearch } = p;
  if (conditions.status === 'ready' && conditions.aqi !== undefined && conditions.category) {
    return <RoutineView aqi={conditions.aqi} category={conditions.category} cityName={conditions.cityName ?? ''} profile={profile} />;
  }
  return <TabEmptyNotice tabName="Daily Routine" onLaunchDemo={onLaunchDemo} onFocusSearch={onFocusSearch} />;
}

function IndoorPanel(p: AppTabPanelsProps): ReactElement {
  const { conditions, onLaunchDemo, onFocusSearch } = p;
  if (conditions.status === 'ready' && conditions.aqi !== undefined) {
    return <IndoorView aqi={conditions.aqi} cityName={conditions.cityName ?? ''} />;
  }
  return <TabEmptyNotice tabName="Indoor Hacks" onLaunchDemo={onLaunchDemo} onFocusSearch={onFocusSearch} />;
}

function ImpactPanel(p: AppTabPanelsProps): ReactElement {
  const { conditions, domainProfile, onLaunchDemo, onFocusSearch } = p;
  if (conditions.status === 'ready' && conditions.aqi !== undefined && conditions.pm25 !== undefined) {
    return <ImpactView aqi={conditions.aqi} pm25={conditions.pm25} cityName={conditions.cityName ?? ''} vulnerability={domainProfile.vulnerability} />;
  }
  return <TabEmptyNotice tabName="Impact Explainer" onLaunchDemo={onLaunchDemo} onFocusSearch={onFocusSearch} />;
}

function ChatPanel(p: AppTabPanelsProps): ReactElement {
  const { conditions } = p;
  return <ChatView aqi={conditions.aqi ?? 0} category={conditions.category ?? 'Moderate'} cityName={conditions.cityName ?? 'your city'} />;
}

function CommunityPanel(p: AppTabPanelsProps): ReactElement {
  const { conditions, onLaunchDemo, onFocusSearch } = p;
  if (conditions.status === 'ready' && conditions.aqi !== undefined && conditions.category) {
    return <CommunityKitView aqi={conditions.aqi} category={conditions.category} cityName={conditions.cityName ?? ''} />;
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
