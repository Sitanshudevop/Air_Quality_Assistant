// Chaos tests for mode, language, tour storage keys and full clearProfile() application reset.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { APP_LOCAL_STORAGE_KEYS } from '../constants/index.js';
import { LANGUAGE_STORAGE_KEY, loadLanguagePreference, saveLanguagePreference } from '../i18n/index.js';
import { loadModePreference, MODE_STORAGE_KEY } from '../state/mode.js';
import { isTourCompleted, resetTourCompleted, skipTour } from '../features/onboarding/tour-steps.js';
import { fetchAirQuality, clearAirQualityCache } from './airQuality.js';
import { fetchForecast, clearForecastCache } from './forecast.js';
import { searchLocations, clearGeocodingCache } from './geocoding.js';
import { createManualReading, getManualReading, saveManualReading } from './manualReading.js';
import { clearProfile, getProfile, saveProfile } from './profile.js';

describe('Mode, Language, Tour Chaos & Full clearProfile() Purge', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearProfile();
    window.localStorage.clear();
    window.sessionStorage.clear();
    resetTourCompleted();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('recovers safely from tampered operating mode, language, and tour keys', () => {
    for (const badMode of ['admin', '{"__proto__":1}', '', 'LIVE']) {
      window.localStorage.setItem(MODE_STORAGE_KEY, badMode);
      expect(loadModePreference()).toBe('demo');
    }
    for (const badLang of ['fr', '{"__proto__":1}', 'HI', '']) {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, badLang);
      expect(loadLanguagePreference()).toBe('en');
    }
    for (const badTour of ['false', '1', '{}', '{"__proto__":1}']) {
      window.localStorage.setItem('saans_tour_completed', badTour);
      expect(isTourCompleted()).toBe(false);
    }
  });

  it('handles localStorage getItem/setItem throws gracefully across mode, language, and tour helpers', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    expect(loadModePreference()).toBe('demo');
    expect(loadLanguagePreference()).toBe('en');
    expect(() => saveLanguagePreference('hi')).not.toThrow();
    expect(() => skipTour()).not.toThrow();
    expect(isTourCompleted()).toBe(true);
  });

  it('purges all 5 localStorage keys, sessionStorage, tour memory, and L1 caches on clearProfile()', async () => {
    saveProfile({ cityName: 'Lucknow' });
    saveLanguagePreference('hi');
    skipTour();
    window.localStorage.setItem(MODE_STORAGE_KEY, 'live');
    window.localStorage.setItem('saans_chat_history_v1', '[]');
    saveManualReading(createManualReading({ aqi: 210, cityName: 'Lucknow' }));

    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ latitude: 26.85, longitude: 80.95, current: { pm2_5: 80 }, hourly: { time: ['2026-11-26T00:00Z'], pm2_5: [80] } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ latitude: 26.85, longitude: 80.95, current: { temperature_2m: 20 }, hourly: { time: ['2026-11-26T00:00Z'], temperature_2m: [20] } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 1, name: 'Lucknow', latitude: 26.85, longitude: 80.95 }] }),
      } as Response);

    await fetchAirQuality(26.85, 80.95);
    await fetchForecast(26.85, 80.95);
    await searchLocations('Lucknow');
    expect(fetchSpy).toHaveBeenCalledTimes(3);

    clearProfile();

    for (const key of APP_LOCAL_STORAGE_KEYS) {
      expect(window.localStorage.getItem(key)).toBeNull();
    }
    expect(window.sessionStorage.length).toBe(0);
    expect(isTourCompleted()).toBe(false);
    expect(getManualReading()).toBeNull();
    expect(getProfile().cityName).toBe('Delhi');

    clearAirQualityCache();
    clearForecastCache();
    clearGeocodingCache();
  });
});
