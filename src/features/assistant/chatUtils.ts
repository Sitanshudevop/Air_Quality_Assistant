// Chat message types, localStorage persistence, suggestion chips, and safety card detection.
import type { Provenance } from '../../../shared/types.js';

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
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
    }
  } catch {
    // Ignore malformed JSON or storage errors
  }
  return [];
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
  } catch {
    // Ignore storage quota errors
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
  } catch {
    // Ignore storage errors
  }
}
