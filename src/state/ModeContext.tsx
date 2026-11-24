// React context and hook for global operating mode (Live vs Demo) state.
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  DEFAULT_MODE,
  loadModePreference,
  onModeChange,
  saveModePreference,
  type OperatingMode,
} from './mode.js';

export interface ModeContextValue {
  readonly mode: OperatingMode;
  readonly setMode: (mode: OperatingMode) => void;
  readonly toggleMode: () => void;
  readonly isDemo: boolean;
  readonly isLive: boolean;
}

const ModeContext = createContext<ModeContextValue | undefined>(undefined);

export interface ModeProviderProps {
  readonly children: React.ReactNode;
  readonly initialMode?: OperatingMode;
}

/**
 * Provider component supplying operating mode state to the React component tree.
 *
 * @param props - Component props with children and optional initialMode.
 * @returns JSX Element wrapping children with ModeContext.
 */
export function ModeProvider({
  children,
  initialMode,
}: ModeProviderProps): React.ReactElement {
  const [mode, setModeState] = useState<OperatingMode>(
    initialMode ?? loadModePreference() ?? DEFAULT_MODE
  );

  useEffect(() => {
    saveModePreference(mode);
  }, [mode]);

  useEffect(() => {
    const unsubscribe = onModeChange((newMode) => {
      setModeState(newMode);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<ModeContextValue>(() => {
    return {
      mode,
      setMode: (newMode: OperatingMode): void => {
        setModeState(newMode);
        saveModePreference(newMode);
      },
      toggleMode: (): void => {
        const next: OperatingMode = mode === 'demo' ? 'live' : 'demo';
        setModeState(next);
        saveModePreference(next);
      },
      isDemo: mode === 'demo',
      isLive: mode === 'live',
    };
  }, [mode]);

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

/**
 * Hook to consume current operating mode and mode transitions.
 *
 * @returns ModeContextValue.
 */
export function useMode(): ModeContextValue {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}
