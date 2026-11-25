// Indoor air quality hacks view with WAI-ARIA room tabs, CADR, timer, CR-box, myths, and AI tips.
import { useMemo, useState, type KeyboardEvent, type ReactElement } from 'react';
import { getIndoorRecommendations } from '../../domain/indoor.js';
import type { IndoorTipsResult, Provenance } from '../../../shared/types.js';
import { useAiTask } from '../../hooks/useAiTask.js';
import { useLanguage } from '../../state/language.js';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge.js';
import { Button } from '../../components/ui/Button.js';
import { CadrCalculator } from './CadrCalculator.js';
import { CorsiRosenthalGuide } from './CorsiRosenthalGuide.js';
import { INDOOR_ROOM_TABS, type IndoorRoomTabId } from './indoorData.js';
import { MythBusterCards } from './MythBusterCards.js';
import { VentilationTimer } from './VentilationTimer.js';

/** Props for IndoorView component. */
export interface IndoorViewProps {
  readonly aqi: number;
  readonly cityName: string;
}

function getNextTabId(key: string, idx: number): IndoorRoomTabId | null {
  const count = INDOOR_ROOM_TABS.length;
  const map: Record<string, number> = {
    ArrowRight: (idx + 1) % count,
    ArrowLeft: (idx - 1 + count) % count,
    Home: 0,
    End: count - 1,
  };
  const nextIdx = map[key];
  return nextIdx !== undefined ? INDOOR_ROOM_TABS[nextIdx].id : null;
}

function IndoorAiTipsCard(props: {
  roomLabel: string;
  tips: readonly string[];
  provenance: Provenance;
  isLoading: boolean;
  onTrigger: () => void;
}): ReactElement {
  return (
    <div aria-live="polite" aria-busy={props.isLoading} className="p-4 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-950/30 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold">AI Room Tips ({props.roomLabel})</h3>
        <div className="flex flex-wrap items-center gap-2">
          <ProvenanceBadge provenance={props.provenance} onRetry={props.onTrigger} isRetrying={props.isLoading} />
          <Button size="sm" variant="outline" onClick={props.onTrigger} disabled={props.isLoading}>
            {props.isLoading ? 'Loading...' : 'Get AI Tips'}
          </Button>
        </div>
      </div>
      <ul className="list-disc list-inside text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
        {props.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Room-specific indoor air protection suite with interactive CADR, timer, DIY guide, and AI tips.
 *
 * @param props - Current outdoor AQI and city name.
 * @returns Accessible Indoor Hacks section element.
 */
export function IndoorView({ aqi, cityName }: IndoorViewProps): ReactElement {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<IndoorRoomTabId>('living');
  const activeRoom = INDOOR_ROOM_TABS.find((tab) => tab.id === activeTab) ?? INDOOR_ROOM_TABS[0];

  const recs = useMemo(
    () =>
      getIndoorRecommendations({
        roomType: activeRoom.domainRoomType,
        roomAreaSqFt: activeRoom.defaultAreaSqFt,
        ceilingHeightFt: 9,
        currentOutdoorAqi: aqi,
      }),
    [activeRoom, aqi]
  );

  const ai = useAiTask<IndoorTipsResult>({
    task: 'indoor-tips',
    context: {
      aqi: Math.round(aqi),
      city: cityName,
      facts: [`Room: ${activeRoom.label}`, `CADR: ${recs.cadrRequiredCfm} CFM`, recs.ventilation.advice],
    },
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number): void => {
    const nextId = getNextTabId(e.key, idx);
    if (nextId) {
      e.preventDefault();
      setActiveTab(nextId);
    }
  };

  const displayTips = ai.data?.tips ?? [recs.ventilation.advice, ...recs.actions.map((a) => `${a.title}: ${a.detail}`)];

  return (
    <section aria-labelledby="indoor-heading" className="space-y-4">
      <h2 id="indoor-heading" lang={language === 'hi' ? 'hi' : undefined} className="text-lg font-bold">
        {t('indoor.title')}
      </h2>

      <div role="tablist" aria-label="Room selector" className="flex flex-wrap gap-2">
        {INDOOR_ROOM_TABS.map((tab, idx) => {
          const selected = tab.id === activeRoom.id;
          return (
            <button
              key={tab.id}
              id={`indoor-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`indoor-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                selected ? 'bg-sky-700 text-white border-sky-700 dark:bg-sky-500 dark:text-neutral-950' : 'bg-white text-neutral-800 border-neutral-300 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div id={`indoor-panel-${activeRoom.id}`} role="tabpanel" aria-labelledby={`indoor-tab-${activeRoom.id}`} className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 space-y-3">
        <p className="text-xs text-neutral-600 dark:text-neutral-400">{activeRoom.note}</p>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {recs.actions.map((action) => (
            <li key={action.title} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <div className="font-bold">{action.title}</div>
              <p className="mt-1 text-neutral-700 dark:text-neutral-300">{action.detail}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VentilationTimer aqi={aqi} />
        <CadrCalculator key={activeRoom.id} defaultAreaSqFt={activeRoom.defaultAreaSqFt} />
      </div>

      <IndoorAiTipsCard roomLabel={activeRoom.label} tips={displayTips} provenance={ai.provenance} isLoading={ai.isLoading} onTrigger={() => void ai.trigger()} />
      <CorsiRosenthalGuide />
      <MythBusterCards />
    </section>
  );
}
