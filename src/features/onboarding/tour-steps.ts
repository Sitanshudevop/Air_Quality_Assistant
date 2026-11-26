// Compatibility tour steps and state progression helpers for guided onboarding.
import { TOUR_STEPS } from './tourSteps.js';

export { TOUR_STEPS };

const TOUR_COMPLETED_KEY = 'saans_tour_completed';
let memoryCompleted = false;

/**
 * Computes the next 1-based tour step number bounded by total tour steps.
 *
 * @param currentStep - Current 1-based step index.
 * @returns Next step index, capped at TOUR_STEPS.length.
 */
export function getNextStep(currentStep: number): number {
  const safe = Number.isFinite(currentStep) ? Math.max(1, Math.floor(currentStep)) : 1;
  return Math.min(TOUR_STEPS.length, safe + 1);
}

/**
 * Marks the guided tour as skipped/completed in storage.
 */
export function skipTour(): void {
  memoryCompleted = true;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    }
  } catch {
    // Ignore storage access errors
  }
}

/**
 * Checks whether the user has previously completed or skipped the guided tour.
 *
 * @returns True if tour completion is persisted in memory or localStorage.
 */
export function isTourCompleted(): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const completed = window.localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
      memoryCompleted = completed;
      return completed;
    }
  } catch {
    return memoryCompleted;
  }
  return memoryCompleted;
}

/**
 * Resets tour completion state (primarily for testing or replay).
 */
export function resetTourCompleted(): void {
  memoryCompleted = false;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(TOUR_COMPLETED_KEY);
    }
  } catch {
    // Ignore storage access errors
  }
}
