// Grounded accessible AI assistant chat view with provenance, suggestions, safety cards, and retry.
import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import type { AqiCategory, VulnerabilityGroup } from '../../domain/types.js';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';
import type { PollutantValues } from '../dashboard/PollutantCard.js';
import { useLanguage } from '../../state/language.js';
import { getErrorMessage } from '../../utils/error.js';
import { logError } from '../../utils/logger.js';
import { Button } from '../../components/ui/Button.js';
import { ChatMessageBubble } from './ChatMessageBubble.js';
import { fetchChatReply } from './chatContext.js';
import { clearChatHistory, loadChatHistory, PROMPT_SUGGESTIONS, saveChatHistory, type ChatMessage } from './chatUtils.js';

/** Props for ChatView component. */
export interface ChatViewProps {
  readonly aqi: number;
  readonly category: AqiCategory;
  readonly cityName: string;
  readonly pollutants?: PollutantValues;
  readonly hourlyPoints?: readonly HourlyAirQualityPoint[];
  readonly vulnerability?: VulnerabilityGroup;
}

function ChatHeader(props: { title: string; disclaimer: string; isHindi: boolean; onClear: () => void }): ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 id="chat-heading" lang={props.isHindi ? 'hi' : undefined} className="text-lg font-bold">{props.title}</h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">{props.disclaimer}</p>
      </div>
      <Button size="sm" variant="outline" onClick={props.onClear}>Clear Chat</Button>
    </div>
  );
}

/**
 * Accessible grounded assistant chat interface with debounce guard, safety triage styling, and retry.
 *
 * @param props - Active air quality context for grounded responses.
 * @returns Accessible chat section element.
 */
export function ChatView({ aqi, category, cityName, pollutants, hourlyPoints, vulnerability }: ChatViewProps): ReactElement {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatHistory());
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedPrompt, setFailedPrompt] = useState<string | null>(null);
  const inFlightRef = useRef<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => { abortRef.current?.abort(); }, []);
  useEffect(() => {
    if (messages.length === 0) clearChatHistory();
    else saveChatHistory(messages);
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (rawText: string): Promise<void> => {
    const trimmed = rawText.trim();
    if (!trimmed || inFlightRef.current) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    inFlightRef.current = true;
    setIsLoading(true);
    setErrorMsg(null);
    setFailedPrompt(null);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: trimmed }]);
    setInput('');
    try {
      const botMsg = await fetchChatReply({ aqi, category, cityName, userText: trimmed, signal: controller.signal, pollutants, hourlyPoints, vulnerability, history: messages });
      if (!controller.signal.aborted) setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      if (controller.signal.aborted) return;
      logError('Assistant chat request failed', { action: 'sendChatMessage', error: getErrorMessage(err) });
      setErrorMsg('Unable to send message. Please check your connection and retry.');
      setFailedPrompt(trimmed);
    } finally {
      if (abortRef.current === controller) { inFlightRef.current = false; setIsLoading(false); }
    }
  };

  const handleClear = (): void => {
    abortRef.current?.abort();
    abortRef.current = null;
    inFlightRef.current = false;
    setIsLoading(false);
    setMessages([]);
    setErrorMsg(null);
    clearChatHistory();
  };

  return (
    <section aria-labelledby="chat-heading" className="space-y-4">
      <ChatHeader title={t('assistant.title')} disclaimer={t('disclaimer.medical')} isHindi={language === 'hi'} onClear={handleClear} />
      <div className="flex flex-wrap gap-2" aria-label="Prompt suggestions">
        {PROMPT_SUGGESTIONS.map((chip) => <Button key={chip} size="sm" variant="secondary" disabled={isLoading} onClick={() => void sendMessage(chip)}>{chip}</Button>)}
      </div>
      <div role="log" aria-live="polite" aria-relevant="additions" aria-busy={isLoading} className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 min-h-[220px] max-h-[420px] overflow-y-auto space-y-3">
        {messages.length === 0 ? <p className="text-xs text-neutral-500 dark:text-neutral-400">Ask a question about today&apos;s air quality in {cityName} or choose a suggestion above.</p> : messages.map((m) => <ChatMessageBubble key={m.id} msg={m} isLoading={isLoading} onRetry={(p) => void sendMessage(p)} onSuggestion={(s) => void sendMessage(s)} />)}
        {isLoading && <p className="text-xs font-medium text-sky-700 dark:text-sky-300">Thinking...</p>}
        <div ref={endRef} />
      </div>
      {errorMsg && (
        <div role="alert" className="p-3 rounded-lg border border-rose-400 bg-rose-50 dark:bg-rose-950/50 text-xs text-rose-900 dark:text-rose-100 flex items-center justify-between gap-2">
          <span>{errorMsg}</span>
          {failedPrompt && <Button size="sm" variant="outline" onClick={() => void sendMessage(failedPrompt)}>Retry</Button>}
        </div>
      )}
      <form onSubmit={(e: FormEvent<HTMLFormElement>) => { e.preventDefault(); void sendMessage(input); }} className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="chat-input" className="sr-only">Ask the Saans air quality assistant</label>
        <input id="chat-input" type="text" maxLength={1000} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about ventilation, masks, or outdoor safety..." className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
        <Button type="submit" variant="primary" disabled={isLoading || !input.trim()}>{isLoading ? 'Sending...' : 'Send'}</Button>
      </form>
    </section>
  );
}
