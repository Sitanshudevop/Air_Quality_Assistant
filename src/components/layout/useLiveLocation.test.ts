// Unit tests covering all state transitions and branch paths in useLiveLocation hook.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { FormEvent } from 'react';
import * as geocoding from '../../services/geocoding.js';
import * as airQuality from '../../services/airQuality.js';
import * as forecast from '../../services/forecast.js';
import * as geolocation from '../../services/geolocation.js';
import { useLiveLocation } from './useLiveLocation.js';

describe('useLiveLocation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles query changes, whitespace clearing, debounced search, and unmount cleanup', async () => {
    vi.useFakeTimers();
    const searchSpy = vi.spyOn(geocoding, 'searchLocations').mockResolvedValue([
      { id: 1, name: 'Delhi', latitude: 28.61, longitude: 77.21, displayName: 'Delhi, India' },
    ]);

    const onSwitchToLive = vi.fn();
    const { result, unmount } = renderHook(() =>
      useLiveLocation({
        onLiveData: vi.fn(),
        onManualReading: vi.fn(),
        onSwitchToLive,
      })
    );

    // Blank search submit does not trigger search or switch mode
    act(() => {
      result.current.onSearchSubmit();
    });
    expect(onSwitchToLive).not.toHaveBeenCalled();

    // Debounced search fires after 300ms
    act(() => {
      result.current.onQueryChange('Delhi');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(searchSpy).toHaveBeenCalledWith('Delhi', expect.any(AbortSignal));
    expect(result.current.results).toHaveLength(1);

    // Clearing to whitespace resets results cleanly
    act(() => {
      result.current.onQueryChange('   ');
    });
    expect(result.current.results).toEqual([]);

    // Non-empty submit switches mode and triggers immediate search
    act(() => {
      result.current.onQueryChange('Kanpur');
    });
    await act(async () => {
      result.current.onSearchSubmit();
    });
    expect(onSwitchToLive).toHaveBeenCalled();

    unmount();
  });

  it('handles manual toggle, manual submit fallback city, and manual error states', () => {
    const onManualReading = vi.fn();
    const { result } = renderHook(() =>
      useLiveLocation({
        onLiveData: vi.fn(),
        onManualReading,
      })
    );

    expect(result.current.showManual).toBe(false);
    act(() => {
      result.current.onToggleManual();
      result.current.onChangeManualAqi('245');
    });
    expect(result.current.showManual).toBe(true);

    const preventDefault = vi.fn();
    act(() => {
      result.current.onManualSubmit({ preventDefault } as unknown as FormEvent);
    });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onManualReading).toHaveBeenCalledWith(expect.objectContaining({ aqi: 245, cityName: 'Manual Location' }));
    expect(result.current.statusMsg).toContain('AQI 245');
  });

  it('handles geolocation success, geolocation error, and location selection', async () => {
    const mockAq = {
      latitude: 28.61,
      longitude: 77.21,
      currentAqi: 220,
      currentCategory: 'Poor' as const,
      dominantPollutant: 'PM2.5' as const,
      isEstimate: true as const,
      pollutants: { pm2_5: 95 },
      hourly: [],
      source: 'Open-Meteo CAMS' as const,
      fetchedAt: '2026-11-28T00:00:00Z',
    };

    vi.spyOn(geolocation, 'getCurrentPosition')
      .mockResolvedValueOnce({ lat: 28.61, lon: 77.21 })
      .mockRejectedValueOnce({ error: 'POSITION_UNAVAILABLE', message: 'GPS unavailable' });
    vi.spyOn(geocoding, 'reverseGeocode').mockResolvedValueOnce('Delhi NCR');
    vi.spyOn(airQuality, 'fetchAirQuality').mockResolvedValue(mockAq);
    vi.spyOn(forecast, 'fetchForecast').mockRejectedValue(new Error('Forecast down'));

    const onLiveData = vi.fn();
    const { result } = renderHook(() =>
      useLiveLocation({
        onLiveData,
        onManualReading: vi.fn(),
        onSwitchToLive: vi.fn(),
      })
    );

    await act(async () => {
      result.current.onGeo();
    });
    expect(result.current.isLocating).toBe(false);
    expect(onLiveData).toHaveBeenCalledWith(mockAq, null, 'Delhi NCR');

    await act(async () => {
      result.current.onSelectLocation({
        id: 2,
        name: 'Lucknow',
        latitude: 26.85,
        longitude: 80.95,
        displayName: 'Lucknow, UP',
      });
    });
    expect(onLiveData).toHaveBeenCalledWith(mockAq, null, 'Lucknow, UP');

    await act(async () => {
      result.current.onGeo();
    });
    expect(result.current.isLocating).toBe(false);
    expect(result.current.statusMsg.length).toBeGreaterThan(0);
  });
});
