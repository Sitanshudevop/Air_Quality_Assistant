// Helper building rich grounded chat context and executing assistant replies.
import { getAiResponse } from '../../services/ai.js';
import type { AqiCategory, VulnerabilityGroup } from '../../domain/types.js';
import { compareAlternatives } from '../../domain/alternatives.js';
import { getVentilationRecommendation } from '../../domain/indoor.js';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';
import type { PollutantValues } from '../dashboard/PollutantCard.js';
import { findActivityWindows } from '../outlook/outlookUtils.js';
import type { ChatResult } from '../../../shared/types.js';
import { detectSafetyResponse, type ChatMessage } from './chatUtils.js';

/** Options for requesting a grounded assistant reply. */
export interface FetchChatReplyOptions {
  readonly aqi: number;
  readonly category: AqiCategory;
  readonly cityName: string;
  readonly userText: string;
  readonly signal: AbortSignal;
  readonly pollutants?: PollutantValues;
  readonly hourlyPoints?: readonly HourlyAirQualityPoint[];
  readonly vulnerability?: VulnerabilityGroup;
  readonly history?: readonly ChatMessage[];
}

const POLLUTANT_LABELS: ReadonlyArray<readonly [keyof PollutantValues, string]> = [
  ['pm2_5', 'PM2.5'],
  ['pm10', 'PM10'],
  ['no2', 'NO2'],
];

function buildPollutantMap(p?: PollutantValues): Record<string, number> | undefined {
  if (!p) return undefined;
  const out: Record<string, number> = {};
  for (const [key] of POLLUTANT_LABELS) {
    const val = p[key];
    if (typeof val === 'number') out[key] = val;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

const pollutantFactsCache = new WeakMap<PollutantValues, readonly string[]>();
const activityWindowsCache = new WeakMap<readonly HourlyAirQualityPoint[], string>();

function getPollutantFactsMemo(pollutants?: PollutantValues): readonly string[] {
  if (!pollutants) return [];
  const cached = pollutantFactsCache.get(pollutants);
  if (cached) return cached;
  const facts: string[] = [];
  for (const [key, label] of POLLUTANT_LABELS) {
    const val = pollutants[key];
    if (typeof val === 'number') facts.push(`${label}: ${Math.round(val)} ug/m3.`);
  }
  pollutantFactsCache.set(pollutants, facts);
  return facts;
}

function getWindowFactMemo(hourlyPoints?: readonly HourlyAirQualityPoint[]): string | null {
  if (!hourlyPoints?.length) return null;
  const cached = activityWindowsCache.get(hourlyPoints);
  if (cached !== undefined) return cached || null;
  const win = findActivityWindows(hourlyPoints);
  if (!win) {
    activityWindowsCache.set(hourlyPoints, '');
    return null;
  }
  const fact = `Best ventilation: ${win.best.hourLabel} (AQI ${win.best.aqi}). Peak inversion: ${win.worst.hourLabel} (AQI ${win.worst.aqi}).`;
  activityWindowsCache.set(hourlyPoints, fact);
  return fact;
}

function getCommuteComparisonFact(pm25: number, vulnerability?: VulnerabilityGroup): string | null {
  if (!Number.isFinite(pm25) || pm25 <= 0) return null;
  const results = compareAlternatives(
    { id: 'base', title: 'Petrol two-wheeler (unmasked)', mode: 'two_wheeler_petrol', maskType: 'none', distanceKm: 10 },
    [
      { id: 'bike-n95', title: 'Petrol two-wheeler (N95)', mode: 'two_wheeler_petrol', maskType: 'n95', distanceKm: 10 },
      { id: 'metro-n95', title: 'Metro (N95)', mode: 'metro', maskType: 'n95', distanceKm: 10 },
    ],
    pm25,
    vulnerability
  );
  const [n95, metro] = results;
  if (!n95 || !metro) return null;
  return `Commute PM2.5 impact (10 km vs unmasked petrol two-wheeler): N95 on two-wheeler cuts inhaled dose by ${Math.abs(n95.relativeDoseChangePct)}%; switching to Metro with N95 cuts inhaled dose by ${Math.abs(metro.relativeDoseChangePct)}% and saves ${Math.abs(metro.co2eDeltaGrams)} g CO2e per trip.`;
}

function buildContextFacts(opts: FetchChatReplyOptions): string[] {
  const safeAqi = Math.round(opts.aqi);
  const effectivePm25 = opts.pollutants?.pm2_5 ?? safeAqi;
  const vent = getVentilationRecommendation(safeAqi);
  const facts = [
    `Current AQI in ${opts.cityName} is ${safeAqi} (${opts.category}).`,
    `Ventilation guidance now: ${vent.advice}`,
    safeAqi > 100
      ? 'Commute guidance: closed-window Metro or AC car on recirculation cuts traffic particulate exposure compared to open two-wheelers or roadside walking; wear a fitted N95/FFP2 mask outdoors.'
      : 'Commute guidance: standard transit is lower risk; use an N95 mask on high-traffic roads or two-wheelers.',
  ];
  const commuteDelta = getCommuteComparisonFact(effectivePm25, opts.vulnerability);
  if (commuteDelta) facts.push(commuteDelta);
  facts.push(...getPollutantFactsMemo(opts.pollutants));
  const winFact = getWindowFactMemo(opts.hourlyPoints);
  if (winFact) facts.push(winFact);
  if (opts.vulnerability) facts.push(`Household profile: ${opts.vulnerability}.`);
  for (const m of (opts.history ?? []).slice(-4)) {
    facts.push(`Prior ${m.role}: ${m.text.slice(0, 200)}`);
  }
  return facts.slice(0, 20);
}

/**
 * Requests an AI-assisted chat reply grounded in live AQI, pollutants, forecast, and history.
 *
 * @param opts - Air quality context, user prompt, and abort signal.
 * @returns Formatted assistant ChatMessage.
 */
export async function fetchChatReply(opts: FetchChatReplyOptions): Promise<ChatMessage> {
  const { aqi, category, cityName, userText, signal } = opts;
  const safeCity = cityName.trim() || 'Selected Location';
  const res = await getAiResponse({
    task: 'chat',
    context: {
      aqi: Math.min(1000, Math.max(0, Math.round(aqi))),
      city: safeCity.slice(0, 100),
      facts: buildContextFacts({ ...opts, cityName: safeCity }),
      pollutants: buildPollutantMap(opts.pollutants),
      userPreferences: opts.vulnerability ? { vulnerability: opts.vulnerability } : undefined,
    },
    userText,
    signal,
  });
  const result = res.result as ChatResult;
  const replyText = result?.reply ?? `Current AQI in ${cityName} is ${Math.round(aqi)} (${category}).`;
  return {
    id: `a-${Date.now()}`,
    role: 'assistant',
    text: replyText,
    promptText: userText,
    provenance: res.provenance,
    suggestedActions: result?.suggestedActions,
    isSafetyCard: detectSafetyResponse(userText, replyText),
  };
}
