// Operating mode state manager governing Live and Demo modes and transitions.
import { roundCoordinates } from '../services/geolocation.js';

export { roundCoordinates };

export type OperatingMode = 'live' | 'demo';

export const DEFAULT_MODE: OperatingMode = 'demo';
export const MODE_STORAGE_KEY = 'saans_operating_mode';
export const DEMO_BANNER_TEXT = 'Demo mode: sample air-quality data. AI answers are live.';

export interface DataProviderDescriptor {
  readonly mode: OperatingMode;
  readonly isDemo: boolean;
  readonly isLive: boolean;
}

type ModeChangeListener = (newMode: OperatingMode) => void;
const modeChangeListeners = new Set<ModeChangeListener>();

/**
 * Resolves a raw or stored mode string safely to a valid OperatingMode.
 *
 * @param storedValue - Value retrieved from storage or input.
 * @returns 'live' if explicitly set, otherwise 'demo'.
 */
export function resolveMode(storedValue?: string | null): OperatingMode {
  return storedValue === 'live' ? 'live' : 'demo';
}

/**
 * Toggles operating mode between 'demo' and 'live'.
 *
 * @param currentMode - Active operating mode.
 * @returns Inverted operating mode.
 */
export function toggleMode(currentMode: OperatingMode): OperatingMode {
  const nextMode: OperatingMode = currentMode === 'demo' ? 'live' : 'demo';
  notifyModeChange(nextMode);
  return nextMode;
}

/**
 * Saves user operating mode preference to browser localStorage.
 *
 * @param mode - Operating mode to persist.
 */
export function saveModePreference(mode: OperatingMode): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    }
  } catch {
    // Quota or security error: ignore
  }
}

/**
 * Loads persisted operating mode preference, defaulting to 'demo'.
 *
 * @returns Valid OperatingMode.
 */
export function loadModePreference(): OperatingMode {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
      return resolveMode(stored);
    }
  } catch {
    // ignore
  }
  return DEFAULT_MODE;
}

/**
 * Resolves data provider descriptor for the given mode.
 *
 * @param mode - Operating mode.
 * @returns DataProviderDescriptor object.
 */
export function getDataProvider(mode: OperatingMode): DataProviderDescriptor {
  return {
    mode,
    isDemo: mode === 'demo',
    isLive: mode === 'live',
  };
}

/**
 * Notifies all registered listeners of a mode transition.
 *
 * @param mode - New operating mode.
 */
function notifyModeChange(mode: OperatingMode): void {
  for (const listener of modeChangeListeners) {
    try {
      listener(mode);
    } catch {
      // ignore
    }
  }
}

/**
 * Registers an observer for operating mode changes with an unsubscribe handle.
 *
 * @param handler - Callback invoked with new mode.
 * @returns Unsubscribe function.
 */
export function onModeChange(handler: (mode: OperatingMode) => void): () => void {
  modeChangeListeners.add(handler);
  return (): void => {
    modeChangeListeners.delete(handler);
  };
}
