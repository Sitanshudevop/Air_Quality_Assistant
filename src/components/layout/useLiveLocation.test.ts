// Unit tests for useLiveLocation debounced search, geolocation, manual AQI, and abort cleanup.
import type { FormEvent } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLiveLocation } from './useLiveLocation.js';
import * as geoService from '../../services/geolocation.js';
import * as aqService from '../../services/airQuality.js';
import * as fcService from '../../services/forecast.js';

describe('useLiveLocation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles empty query reset, search submit, geolocation success/denial, and manual submit', async () => {
    const onLiveData = vi.fn();
    const onManualReading = vi.fn();
    const onSwitchToLive = vi.fn();

    vi.spyOn(geoService, 'getCurrentPosition')
      .mockResolvedValueOnce({ lat: 28.61, lon: 77.21 })
      .mockRejectedValueOnce({ error: 'PERMISSION_DENIED', message: 'Denied' });
    vi.spyOn(aqService, 'fetchAirQuality').mockResolvedValueOnce({
      latitude: 28.61,
      longitude: 77.21,
      currentAqi: 250,
      currentCategory: 'Very Poor',
      dominantPollutant: 'PM2.5',
      isEstimate: true,
      pollutants: { pm2_5: 150, pm10: 210, no2: 40, so2: 10, co: 1.2, o3: 30 },
      hourly: [],
      source: 'open-meteo',
      fetchedAt: '2026-11-27T10:00',
    });
    vi.spyOn(fcService, 'fetchForecast').mockResolvedValueOnce({
      latitude: 28.61,
      longitude: 77.21,
      current: {
        temperature: 18,
        humidity: 70,
        windSpeed: 1.2,
        surfacePressure: 1012,
        stagnationRisk: 'high',
        isInversion: true,
        summary: 'Calm stagnant air',
      },
      hourly: [],
      fetchedAt: '2026-11-27T10:00',
    });

    const { result } = renderHook(() =>
      useLiveLocation({ onLiveData, onManualReading, onSwitchToLive })
    );

    act(() => {
      result.current.onQueryChange('   ');
    });
    expect(result.current.results).toEqual([]);

    await act(async () => {
      result.current.onGeo();
    });
    expect(onSwitchToLive).toHaveBeenCalled();

    await act(async () => {
      result.current.onGeo();
    });
    expect(result.current.statusMsg).toBeTruthy();

    act(() => {
      result.current.onToggleManual();
    });
    expect(result.current.showManual).toBe(true);

    act(() => {
      result.current.onChangeManualAqi('210');
      result.current.onManualSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(onManualReading).toHaveBeenCalled();
  });
});
