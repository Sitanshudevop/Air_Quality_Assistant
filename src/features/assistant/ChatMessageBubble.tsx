// Chat message bubble component displaying structured plain-text replies, provenance, and suggestions.
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

function StructuredMessageBody({ text }: { text: string }): ReactElement {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) {
    return <p className="whitespace-pre-wrap break-words leading-relaxed">{text}</p>;
  }

  const bullets: string[] = [];
  const paragraphs: string[] = [];
  for (const line of lines) {
    const bulletMatch = line.match(/^(?:[-•*]|\d+\.)\s+(.+)$/);
    if (bulletMatch?.[1]) bullets.push(bulletMatch[1]);
    else paragraphs.push(line);
  }

  return (
    <div className="space-y-2 leading-relaxed break-words">
      {paragraphs.map((p, i) => (
        <p key={`p-${i}`} className={i === 0 ? 'font-medium' : ''}>{p}</p>
      ))}
      {bullets.length > 0 && (
        <ul className="list-disc pl-4 space-y-1 text-[13px] text-slate-700 dark:text-neutral-200">
          {bullets.map((b, i) => (
            <li key={`b-${i}`}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Renders one user or assistant chat message with scannable layout, safety styling, and provenance badge.
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
    ? 'self-end w-fit max-w-[75%] rounded-2xl rounded-br-sm bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-sm shadow-sm'
    : msg.isSafetyCard
      ? 'self-start w-full max-w-[85%] rounded-2xl bg-rose-50 text-rose-950 border-2 border-rose-400 dark:bg-rose-950/60 dark:text-rose-100 dark:border-rose-700 p-4 text-sm'
      : 'self-start w-full max-w-[85%] rounded-2xl bg-[#F3F5FA] dark:bg-neutral-800 p-4 text-sm text-slate-800 dark:text-neutral-100';

  return (
    <div className={`space-y-2 ${cardCls}`}>
      {isUser ? <p className="whitespace-pre-wrap break-words">{msg.text}</p> : <StructuredMessageBody text={msg.text} />}
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
              className="px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-full text-[11px] border border-sky-500 bg-white text-sky-900 hover:bg-sky-50 dark:bg-neutral-900 dark:text-sky-200 dark:border-sky-600"
            >
              {act}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
