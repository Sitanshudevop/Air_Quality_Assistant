// Accessible application footer with citations, health disclaimers, and AI status.
import { useEffect, useState, type ReactElement } from 'react';
import { checkAiStatus } from '../../services/ai.js';
import { getAiCallStatus, subscribeAiCallStatus, type LastAiStatus } from '../../services/aiStatus.js';

/** Props for AppFooter component. */
export interface AppFooterProps {
  className?: string;
}

/**
 * Renders the application footer with data attribution, scientific citations, health disclaimers,
 * and live/rule-based operational AI service status with retry.
 *
 * @param props - Optional container styling.
 * @returns React component element.
 */
export function AppFooter({ className = '' }: AppFooterProps): ReactElement {
  const [aiStatus, setAiStatus] = useState<LastAiStatus>(() => getAiCallStatus());
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  useEffect(() => {
    return subscribeAiCallStatus((next) => {
      setAiStatus(next);
    });
  }, []);

  const handleRetry = async (): Promise<void> => {
    setIsRetrying(true);
    try {
      await checkAiStatus();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <footer
      role="contentinfo"
      className={`max-w-5xl mx-auto mt-12 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 space-y-3 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            role="status"
            data-testid="ai-status"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
          >
            <span
              className={`w-2 h-2 rounded-full ${aiStatus === 'live' ? 'bg-emerald-500' : 'bg-amber-500'}`}
              aria-hidden="true"
            />
            {aiStatus === 'live' ? 'AI: live' : 'AI: rule-based mode'}
          </span>

          {aiStatus === 'rules' && (
            <button
              type="button"
              onClick={() => void handleRetry()}
              disabled={isRetrying}
              className="text-xs underline text-sky-700 dark:text-sky-400 hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1"
              aria-label="Retry AI service connection"
            >
              {isRetrying ? 'retrying...' : 'retry'}
            </button>
          )}
        </div>

        <p className="text-[11px]">&copy; {new Date().getFullYear()} Saans. PromptWars Showcase.</p>
      </div>

      <p className="text-[11px]">
        Data: Open-Meteo Air Quality &amp; Weather APIs | CPCB AQI Breakpoints (2014) | WHO 2021
      </p>
      <p className="text-[11px]">
        Privacy: Profile preferences and chat history stay in your browser only. Coordinates are
        rounded to 2 decimals (~1.1 km); no names, addresses, or PII are sent to servers.
      </p>
      <p className="italic text-[11px]">
        Disclaimer: Saans provides instantaneous estimates and scientific exposure reduction guidance;
        not intended as clinical or medical advice.
      </p>
    </footer>
  );
}
