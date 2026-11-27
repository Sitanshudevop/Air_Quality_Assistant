// "What If I Choose...?" side-by-side scenario explainer view with AI summary.
import { useMemo, useState, type ReactElement } from 'react';
import type { MaskType, TransportMode, VulnerabilityGroup } from '../../domain/types.js';
import type { ExplainImpactResult, Provenance } from '../../../shared/types.js';
import { useAiTask } from '../../hooks/useAiTask.js';
import { useLanguage } from '../../state/language.js';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge.js';
import { Button } from '../../components/ui/Button.js';
import { ComparisonCard } from './ComparisonCard.js';
import {
  buildImpactFacts,
  clampDistanceKm,
  evaluateImpactScenarios,
  MASK_OPTIONS,
  TRANSPORT_MODE_OPTIONS,
} from './impactUtils.js';

/** Props for ImpactView component. */
export interface ImpactViewProps {
  readonly aqi: number;
  readonly pm25: number;
  readonly cityName: string;
  readonly vulnerability?: VulnerabilityGroup;
}

const selectCls =
  'w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500';

function ScenarioSelector(props: {
  idPrefix: string;
  heading: string;
  mode: TransportMode;
  mask: MaskType;
  onMode: (m: TransportMode) => void;
  onMask: (m: MaskType) => void;
}): ReactElement {
  return (
    <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 space-y-2">
      <div className="text-xs font-bold">{props.heading}</div>
      <label htmlFor={`${props.idPrefix}-mode`} className="block text-[11px] font-medium">Transport Mode</label>
      <select id={`${props.idPrefix}-mode`} value={props.mode} onChange={(e) => props.onMode(e.target.value as TransportMode)} className={selectCls}>
        {TRANSPORT_MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <label htmlFor={`${props.idPrefix}-mask`} className="block text-[11px] font-medium">Mask Type</label>
      <select id={`${props.idPrefix}-mask`} value={props.mask} onChange={(e) => props.onMask(e.target.value as MaskType)} className={selectCls}>
        {MASK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ImpactAiBox(props: {
  summary: string;
  data: ExplainImpactResult | null;
  provenance: Provenance;
  isLoading: boolean;
  onTrigger: () => void;
}): ReactElement {
  return (
    <div className="p-4 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-950/30 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold">Grounded Impact Explanation</h3>
        <div className="flex flex-wrap items-center gap-2">
          <ProvenanceBadge provenance={props.provenance} onRetry={props.onTrigger} isRetrying={props.isLoading} />
          <Button size="sm" variant="outline" onClick={props.onTrigger} disabled={props.isLoading}>
            {props.isLoading ? 'Explaining...' : 'Explain with AI'}
          </Button>
        </div>
      </div>
      <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed">
        {props.data?.explanation ?? props.summary}
      </p>
      {props.data?.highlights && props.data.highlights.length > 0 && (
        <ul className="list-disc list-inside space-y-1 text-xs text-neutral-700 dark:text-neutral-300">
          {props.data.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      {props.data?.healthAdvice && (
        <p className="pt-1.5 border-t border-sky-200/70 dark:border-sky-800/50 text-xs font-medium text-sky-900 dark:text-sky-200">
          {props.data.healthAdvice}
        </p>
      )}
    </div>
  );
}

/**
 * Compares 2-3 commute/protection scenarios with quantified % dose delta, uncertainty, and CO2e.
 *
 * @param props - Current AQI, PM2.5, city name, and optional vulnerability group.
 * @returns Accessible Impact Explainer section element.
 */
export function ImpactView({ aqi, pm25, cityName, vulnerability }: ImpactViewProps): ReactElement {
  const { t, language } = useLanguage();
  const [distanceKm, setDistanceKm] = useState<number>(10);
  const [baseMode, setBaseMode] = useState<TransportMode>('two_wheeler_petrol');
  const [baseMask, setBaseMask] = useState<MaskType>('none');
  const [opt1Mode, setOpt1Mode] = useState<TransportMode>('two_wheeler_petrol');
  const [opt1Mask, setOpt1Mask] = useState<MaskType>('n95');
  const [opt2Mode, setOpt2Mode] = useState<TransportMode>('metro');
  const [opt2Mask, setOpt2Mask] = useState<MaskType>('n95');

  const results = useMemo(
    () =>
      evaluateImpactScenarios({
        baseline: { id: 'baseline', label: 'Current', mode: baseMode, maskType: baseMask },
        options: [
          { id: 'option-1', label: 'Option A', mode: opt1Mode, maskType: opt1Mask },
          { id: 'option-2', label: 'Option B', mode: opt2Mode, maskType: opt2Mask },
        ],
        distanceKm,
        pm25,
        vulnerability,
      }),
    [baseMode, baseMask, opt1Mode, opt1Mask, opt2Mode, opt2Mask, distanceKm, pm25, vulnerability]
  );

  const maxHigh = Math.max(...results.map((r) => r.doseUncertaintyRangeUg[1]), 1);
  const facts = useMemo(() => buildImpactFacts(results, pm25), [results, pm25]);
  const ai = useAiTask<ExplainImpactResult>({ task: 'explain-impact', context: { aqi: Math.round(aqi), city: cityName, facts } });
  const bestOption = results[2] ?? results[1] ?? results[0];

  return (
    <section aria-labelledby="impact-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="impact-heading" lang={language === 'hi' ? 'hi' : undefined} className="text-lg font-bold">{t('impact.title')}</h2>
        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="impact-distance" className="font-semibold">Distance (km)</label>
          <input id="impact-distance" type="number" min={0} max={200} value={clampDistanceKm(distanceKm)} onChange={(e) => setDistanceKm(clampDistanceKm(Number(e.target.value)))} className="w-20 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-xs" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ScenarioSelector idPrefix="base" heading="Baseline Choice" mode={baseMode} mask={baseMask} onMode={setBaseMode} onMask={setBaseMask} />
        <ScenarioSelector idPrefix="opt1" heading="Alternative A" mode={opt1Mode} mask={opt1Mask} onMode={setOpt1Mode} onMask={setOpt1Mask} />
        <ScenarioSelector idPrefix="opt2" heading="Alternative B" mode={opt2Mode} mask={opt2Mask} onMode={setOpt2Mode} onMask={setOpt2Mask} />
      </div>
      <div aria-live="polite" className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
        {bestOption.title}: {bestOption.relativeDoseChangePct}% exposure change compared to baseline.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {results.map((res, idx) => <ComparisonCard key={res.choiceId} result={res} maxHighDoseUg={maxHigh} isBaseline={idx === 0} />)}
      </div>
      <ImpactAiBox summary={bestOption.summary} data={ai.data} provenance={ai.provenance} isLoading={ai.isLoading} onTrigger={() => void ai.trigger()} />
    </section>
  );
}
