// Morning briefing card delivering "Today at a glance" safety orientation and one-click sharing.
import { useState, type ReactElement } from 'react';
import { Sunrise, Copy, Share2, Check } from 'lucide-react';
import type { AqiCategory, VulnerabilityGroup } from '../../domain/types.js';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';
import { generateMorningBriefing, type MorningBriefing } from '../../domain/morningBriefing.js';

/** Props for MorningBriefingCard component. */
export interface MorningBriefingCardProps {
  readonly cityName?: string;
  readonly aqi?: number;
  readonly category?: AqiCategory;
  readonly vulnerability?: VulnerabilityGroup;
  readonly points?: readonly HourlyAirQualityPoint[];
  readonly className?: string;
}

function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}

function BriefingPillars({ briefing }: { briefing: MorningBriefing }): ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 space-y-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-bento-muted dark:text-neutral-300">Commute Transit</div>
        <p className="text-xs text-bento-ink dark:text-neutral-200 leading-relaxed font-medium">
          {briefing.commuteSafety}
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 space-y-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-bento-muted dark:text-neutral-300">School Morning</div>
        <p className="text-xs text-bento-ink dark:text-neutral-200 leading-relaxed font-medium">
          {briefing.schoolAdvice}
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 space-y-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-bento-muted dark:text-neutral-300">Evening Inversion</div>
        <p className="text-xs text-bento-ink dark:text-neutral-200 leading-relaxed font-medium">
          {briefing.eveningPeak}
        </p>
      </div>
    </div>
  );
}

/**
 * Renders the daily morning briefing summary with commute safety, schools advice, evening peak, and 3-bullet checklist.
 *
 * @param props - City name, current AQI, category, household demographics, and forecast series.
 * @returns React component element or null when AQI is absent.
 */
export function MorningBriefingCard(props: MorningBriefingCardProps): ReactElement | null {
  const { cityName = 'Your City', aqi, category = 'Moderate', vulnerability = 'healthy_adult', points, className = '' } = props;
  const [feedback, setFeedback] = useState<string>('');
  if (aqi === undefined) return null;

  const briefing = generateMorningBriefing({ city: cityName, aqi, category, vulnerability, hourlyPoints: points });

  const handleCopy = async (): Promise<void> => {
    const ok = await copyToClipboard(briefing.shareText);
    setFeedback(ok ? 'Briefing copied!' : 'Could not copy');
    setTimeout(() => setFeedback(''), 2500);
  };

  const handleShare = async (): Promise<void> => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `Saans Briefing - ${cityName}`, text: briefing.shareText });
        return;
      } catch {
        // Fallback to clipboard if share was cancelled
      }
    }
    await handleCopy();
  };

  return (
    <section
      aria-label="Today at a glance morning briefing"
      className={`p-6 rounded-3xl bg-bento-canvas/50 dark:bg-neutral-800/40 space-y-4 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide">
            <Sunrise size={14} aria-hidden="true" /> Today at a glance
          </div>
          <h3 className="text-base font-bold text-bento-ink dark:text-neutral-100">
            Morning Briefing: {cityName}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {feedback && <span role="status" className="text-xs font-semibold text-teal-700 dark:text-teal-400">{feedback}</span>}
          <button type="button" onClick={() => void handleCopy()} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[44px] sm:min-h-0 rounded-full bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-xs font-semibold text-bento-ink dark:text-neutral-200 shadow-sm focus:ring-2 focus:ring-bento-ink/30">
            <Copy size={12} aria-hidden="true" /> Copy Briefing
          </button>
          <button type="button" onClick={() => void handleShare()} className="inline-flex items-center gap-1.5 px-4 py-1.5 min-h-[44px] sm:min-h-0 rounded-full bg-bento-ink text-white dark:bg-white dark:text-bento-ink text-xs font-semibold hover:opacity-90 focus:ring-2 focus:ring-bento-ink/30 shadow-sm">
            <Share2 size={12} aria-hidden="true" /> Share
          </button>
        </div>
      </div>

      <BriefingPillars briefing={briefing} />

      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900">
        <h4 className="text-xs font-bold uppercase tracking-wide text-bento-muted dark:text-neutral-300 mb-2">Priority Action Checklist</h4>
        <ul className="space-y-1.5 text-xs text-bento-ink dark:text-neutral-300">
          {briefing.checklist.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check size={14} className="text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
