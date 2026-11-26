// Operational status tracker for AI proxy service calls and fallback states.
export type LastAiStatus = 'live' | 'rules';

type AiStatusListener = (status: LastAiStatus) => void;
const listeners = new Set<AiStatusListener>();
let currentAiStatus: LastAiStatus = 'rules';

/**
 * Returns current operational AI status.
 *
 * @returns 'live' when Gemini proxy is active, 'rules' on fallback.
 */
export function getAiCallStatus(): LastAiStatus {
  return currentAiStatus;
}

/**
 * Updates operational AI status and notifies registered listeners.
 *
 * @param status - Next AI status.
 */
export function setAiCallStatus(status: LastAiStatus): void {
  currentAiStatus = status;
  listeners.forEach((fn) => fn(status));
}

/**
 * Resets the operational AI status to 'rules' (used primarily in test setups).
 */
export function resetAiCallStatus(): void {
  currentAiStatus = 'rules';
}

/**
 * Subscribes to operational AI status updates.
 *
 * @param listener - Callback receiving updated status.
 * @returns Unsubscribe function.
 */
export function subscribeAiCallStatus(listener: AiStatusListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
