// Helper building rich grounded chat context and executing assistant replies.
import { getAiResponse } from '../../services/ai.js';
import type { AqiCategory, VulnerabilityGroup } from '../../domain/types.js';
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

function buildContextFacts(opts: FetchChatReplyOptions): string[] {
  const facts = [`Current AQI in ${opts.cityName} is ${Math.round(opts.aqi)} (${opts.category}).`];
  for (const [key, label] of POLLUTANT_LABELS) {
    const val = opts.pollutants?.[key];
    if (typeof val === 'number') facts.push(`${label}: ${Math.round(val)} ug/m3.`);
  }
  const win = opts.hourlyPoints?.length ? findActivityWindows(opts.hourlyPoints) : null;
  if (win) facts.push(`Best ventilation: ${win.best.hourLabel} (AQI ${win.best.aqi}). Peak inversion: ${win.worst.hourLabel} (AQI ${win.worst.aqi}).`);
  if (opts.vulnerability) facts.push(`Household profile: ${opts.vulnerability}.`);
  const recent = (opts.history ?? []).slice(-4).map((m) => `${m.role}: ${m.text.slice(0, 120)}`);
  if (recent.length > 0) facts.push(`Recent chat: ${recent.join(' | ')}`);
  return facts;
}

/**
 * Requests an AI-assisted chat reply grounded in live AQI, pollutants, forecast, and history.
 *
 * @param opts - Air quality context, user prompt, and abort signal.
 * @returns Formatted assistant ChatMessage.
 */
export async function fetchChatReply(opts: FetchChatReplyOptions): Promise<ChatMessage> {
  const { aqi, category, cityName, userText, signal } = opts;
  const res = await getAiResponse({
    task: 'chat',
    context: {
      aqi: Math.round(aqi),
      city: cityName,
      facts: buildContextFacts(opts),
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
