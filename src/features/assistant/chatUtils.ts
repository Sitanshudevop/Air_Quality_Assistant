// Chat message types, localStorage persistence, suggestion chips, and safety card detection.
import { z } from 'zod';
import { provenanceSchema } from '../../../shared/schemas.js';
import type { Provenance } from '../../../shared/types.js';
import { getErrorMessage } from '../../utils/error.js';
import { logError } from '../../utils/logger.js';

/** Zod schema validating a persisted chat message entry. */
export const chatMessageSchema = z.object({
  id: z.string().min(1).max(64),
  role: z.enum(['user', 'assistant']),
  text: z.string().min(1).max(4000),
  promptText: z.string().max(1000).optional(),
  provenance: provenanceSchema.optional(),
  suggestedActions: z.array(z.string().max(200)).max(10).optional(),
  isSafetyCard: z.boolean().optional(),
});

/** Zod schema validating bounded chat history array in localStorage. */
export const chatHistorySchema = z.array(chatMessageSchema).max(30);

/** Single chat message entry stored and rendered in ChatView. */
export interface ChatMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly text: string;
  readonly promptText?: string;
  readonly provenance?: Provenance;
  readonly suggestedActions?: readonly string[];
  readonly isSafetyCard?: boolean;
}

/** LocalStorage key for chat history persistence. */
export const CHAT_STORAGE_KEY = 'saans_chat_history_v1';

/** Default starter suggestion chips for quick air quality questions. */
export const PROMPT_SUGGESTIONS: readonly string[] = [
  'Is it safe to open windows now?',
  'Best commute option today?',
  'Tips for children indoors',
  'आज की हवा कैसी है?',
];

const SAFETY_PATTERNS = [
  /\b112\b/i,
  /\b102\b/i,
  /chest pain/i,
  /breathless/i,
  /difficulty breathing/i,
  /seek.*medical/i,
  /not medical advice/i,
  /hospital/i,
  /emergency/i,
];

/**
 * Detects whether a user query or assistant reply involves emergency/medical safety triage.
 *
 * @param userText - Submitted user prompt.
 * @param replyText - Assistant response text.
 * @returns True if the exchange should render safety/emergency card styling.
 */
export function detectSafetyResponse(userText: string, replyText: string): boolean {
  const combined = `${userText} ${replyText}`;
  return SAFETY_PATTERNS.some((re) => re.test(combined));
}

/**
 * Loads saved chat history safely from localStorage.
 *
 * @returns Array of validated ChatMessage records.
 */
export function loadChatHistory(): ChatMessage[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = chatHistorySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      logError('Invalid chat history cleared from localStorage', {
        action: 'loadChatHistory',
        error: parsed.error.message,
      });
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
      return [];
    }
    return parsed.data;
  } catch (err) {
    logError('Failed to parse chat history from localStorage', {
      action: 'loadChatHistory',
      error: getErrorMessage(err),
    });
    try {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup errors
    }
    return [];
  }
}

/**
 * Saves chat history safely to localStorage.
 *
 * @param messages - Current chat history list.
 */
export function saveChatHistory(messages: readonly ChatMessage[]): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    }
  } catch (err) {
    logError('Failed saving chat history to localStorage', {
      action: 'saveChatHistory',
      error: getErrorMessage(err),
    });
  }
}

/**
 * Clears persisted chat history from localStorage.
 */
export function clearChatHistory(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  } catch (err) {
    logError('Failed clearing chat history from localStorage', {
      action: 'clearChatHistory',
      error: getErrorMessage(err),
    });
  }
}
