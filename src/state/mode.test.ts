// Unit tests for operating mode manager, resolution, transitions, and listeners.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DEFAULT_MODE,
  DEMO_BANNER_TEXT,
  getDataProvider,
  loadModePreference,
  onModeChange,
  resolveMode,
  roundCoordinates,
  saveModePreference,
  toggleMode,
} from './mode.js';

describe('Operating Mode State Manager', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('sets demo mode as the default initial experience', () => {
    expect(DEFAULT_MODE).toBe('demo');
  });

  it('toggles mode back and forth between demo and live', () => {
    expect(toggleMode('demo')).toBe('live');
    expect(toggleMode('live')).toBe('demo');
  });

  it('maintains consistent state during rapid toggle spamming', () => {
    let mode: 'live' | 'demo' = 'demo';
    for (let i = 0; i < 10; i++) {
      mode = toggleMode(mode);
    }
    expect(mode).toBe('demo');
  });

  it('contains the mandatory demo banner notice text', () => {
    expect(DEMO_BANNER_TEXT).toContain('Demo mode');
    expect(DEMO_BANNER_TEXT).toContain('sample air-quality data');
    expect(DEMO_BANNER_TEXT).toContain('AI answers are live');
  });

  it('returns appropriate data provider descriptor for each mode', () => {
    const demoProvider = getDataProvider('demo');
    expect(demoProvider.isDemo).toBe(true);
    expect(demoProvider.isLive).toBe(false);

    const liveProvider = getDataProvider('live');
    expect(liveProvider.isLive).toBe(true);
    expect(liveProvider.isDemo).toBe(false);
  });

  it('persists and loads mode preferences from localStorage', () => {
    saveModePreference('live');
    expect(loadModePreference()).toBe('live');

    saveModePreference('demo');
    expect(loadModePreference()).toBe('demo');
  });

  it('resolves corrupted or null values safely to "demo"', () => {
    expect(resolveMode('corrupted_string')).toBe('demo');
    expect(resolveMode(null)).toBe('demo');
    expect(resolveMode(undefined)).toBe('demo');
    expect(resolveMode('live')).toBe('live');
  });

  it('rounds latitude and longitude coordinates to 2 decimal places', () => {
    const coords = roundCoordinates(28.613928, -77.209021);
    expect(coords.lat).toBe(28.61);
    expect(coords.lon).toBe(-77.21);
  });

  it('registers and unsubscribes mode change event listeners', () => {
    const listener = vi.fn();
    const unsubscribe = onModeChange(listener);

    toggleMode('demo');
    expect(listener).toHaveBeenCalledWith('live');

    unsubscribe();
    toggleMode('live');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
