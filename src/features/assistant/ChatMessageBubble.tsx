// Chat message bubble component displaying message text, provenance, and suggestions.
import type { ReactElement } from 'react';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge.js';
import type { ChatMessage } from './chatUtils.js';

/** Props for ChatMessageBubble component. */
export interface ChatMessageBubbleProps {
  readonly msg: ChatMessage;
  readonly isLoading: boolean;
  readonly onRetry: (prompt: string) => void;
  readonly onSuggestion: (chip: string) => void;
}

/**
 * Renders one user or assistant chat message with safety styling and provenance badge.
 *
 * @param props - Message record, loading state, retry handler, and suggestion chip callback.
 * @returns Message bubble element.
 */
export function ChatMessageBubble({
  msg,
  isLoading,
  onRetry,
  onSuggestion,
}: ChatMessageBubbleProps): ReactElement {
  const isUser = msg.role === 'user';
  const cardCls = isUser
    ? 'bg-sky-700 text-white ml-auto max-w-[88%] sm:max-w-[75%]'
    : msg.isSafetyCard
      ? 'bg-rose-50 text-rose-950 border-2 border-rose-400 dark:bg-rose-950/60 dark:text-rose-100 dark:border-rose-700 max-w-[88%] sm:max-w-[75%]'
      : 'bg-neutral-100 text-neutral-900 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700 max-w-[88%] sm:max-w-[75%]';

  return (
    <div className={`p-3 rounded-xl text-xs space-y-2 ${cardCls}`}>
      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
      {!isUser && msg.provenance && (
        <ProvenanceBadge
          provenance={msg.provenance}
          isRetrying={isLoading}
          onRetry={msg.promptText ? () => onRetry(msg.promptText ?? '') : undefined}
        />
      )}
      {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {msg.suggestedActions.map((act) => (
            <button
              key={act}
              type="button"
              onClick={() => onSuggestion(act)}
              className="px-2 py-0.5 rounded-full text-[11px] border border-sky-400 bg-white text-sky-900 hover:bg-sky-50 dark:bg-neutral-900 dark:text-sky-200 dark:border-sky-700"
            >
              {act}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
