// Customizable WhatsApp/RWA circular card with XSS sanitization, validation, AI draft, and copy.
import { useState, type ReactElement } from 'react';
import type { AqiCategory } from '../../domain/types.js';
import type { CommunityMessageResult } from '../../../shared/types.js';
import { useAiTask } from '../../hooks/useAiTask.js';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge.js';
import { Button } from '../../components/ui/Button.js';
import {
  buildOfflineNoticeTemplate,
  formatWhatsAppNotice,
  sanitizeNoticeField,
  validateEmergencyPhone,
} from './communityData.js';

/** Props for CommunityNoticeCard component. */
export interface CommunityNoticeCardProps {
  readonly cityName: string;
  readonly aqi: number;
  readonly category: AqiCategory;
}

async function copyTextWithFeedback(text: string): Promise<string> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return 'Notice copied to clipboard!';
    }
    return 'Clipboard unavailable — please copy the notice text manually.';
  } catch {
    return 'Clipboard blocked — please select and copy the notice text manually.';
  }
}

function NoticeInputs(props: {
  society: string;
  phone: string;
  phoneValid: boolean;
  onSociety: (v: string) => void;
  onPhone: (v: string) => void;
}): ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
      <div>
        <label htmlFor="community-society" className="block font-semibold mb-1">Society / School Name</label>
        <input id="community-society" type="text" value={props.society} onChange={(e) => props.onSociety(e.target.value)} className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 py-1.5 text-xs" />
      </div>
      <div>
        <label htmlFor="community-phone" className="block font-semibold mb-1">Emergency Contact Phone</label>
        <input id="community-phone" type="tel" value={props.phone} onChange={(e) => props.onPhone(e.target.value)} aria-invalid={!props.phoneValid} className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 py-1.5 text-xs" />
        {!props.phoneValid && (
          <p role="alert" className="text-[11px] text-rose-700 dark:text-rose-300 mt-1">
            Enter a valid 6–20 digit phone number (using 112 fallback).
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Generates and copies a customizable community smog circular with clipboard fallback.
 *
 * @param props - Active city, AQI, and category.
 * @returns Interactive notice generator card element.
 */
export function CommunityNoticeCard({ cityName, aqi, category }: CommunityNoticeCardProps): ReactElement {
  const [societyInput, setSocietyInput] = useState<string>('Green Park RWA');
  const [phoneInput, setPhoneInput] = useState<string>('112');
  const [copyStatus, setCopyStatus] = useState<string>('');

  const safeSociety = sanitizeNoticeField(societyInput);
  const phoneValid = validateEmergencyPhone(phoneInput);
  const safePhone = phoneValid ? sanitizeNoticeField(phoneInput) : '112';

  const ai = useAiTask<CommunityMessageResult>({
    task: 'community-message',
    context: { aqi: Math.round(aqi), city: cityName, facts: [`AQI is ${Math.round(aqi)} (${category})`, `Community: ${safeSociety || 'Local RWA'}`] },
    userText: `Draft a WhatsApp notice for ${safeSociety || 'our community'}. Emergency contact: ${safePhone}.`,
  });

  const rawNotice = ai.data?.message
    ? `[${safeSociety || 'Community'}] ${ai.data.message} Contact: ${safePhone}`
    : buildOfflineNoticeTemplate({ cityName, aqi, category, societyName: safeSociety, emergencyPhone: safePhone });
  const noticeText = formatWhatsAppNotice(rawNotice);

  return (
    <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold">WhatsApp &amp; Notice Board Circular</h3>
        <div className="flex flex-wrap items-center gap-2">
          <ProvenanceBadge provenance={ai.provenance} onRetry={() => void ai.trigger()} isRetrying={ai.isLoading} />
          <Button size="sm" variant="outline" onClick={() => void ai.trigger()} disabled={ai.isLoading}>
            {ai.isLoading ? 'Drafting...' : 'Draft with AI'}
          </Button>
        </div>
      </div>

      <NoticeInputs society={societyInput} phone={phoneInput} phoneValid={phoneValid} onSociety={setSocietyInput} onPhone={setPhoneInput} />

      <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs whitespace-pre-wrap break-words">
        {noticeText}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{noticeText.length}/1000 characters</span>
        <Button size="sm" variant="primary" onClick={() => void copyTextWithFeedback(noticeText).then(setCopyStatus)}>
          Copy Notice to Clipboard
        </Button>
      </div>

      {copyStatus && <p role="status" aria-live="polite" className="text-xs font-medium text-sky-800 dark:text-sky-300">{copyStatus}</p>}
    </div>
  );
}
