// Hook managing live Open-Meteo geocoding search, geolocation, and manual AQI reading state.
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { debounce, type DebouncedFunction } from '../../services/debounce.js';
import { getCurrentPosition, handleGeolocationDenied } from '../../services/geolocation.js';
import { createManualReading, saveManualReading, type ManualAirQualityData } from '../../services/manualReading.js';
import type { AirQualityData, ForecastData, GeocodingLocation } from '../../services/openMeteo.types.js';
import { executeCoordsFetch, executeLocationSearch } from './liveLocationHelpers.js';

/** Live location state shared between BentoHeader search and LocationBar results. */
export interface LiveLocationState {
  readonly query: string;
  readonly results: readonly GeocodingLocation[];
  readonly statusMsg: string;
  readonly showManual: boolean;
  readonly isLocating: boolean;
  readonly manualAqi: string;
  readonly onQueryChange: (val: string) => void;
  readonly onSearchSubmit: () => void;
  readonly onGeo: () => void;
  readonly onToggleManual: () => void;
  readonly onChangeManualAqi: (val: string) => void;
  readonly onManualSubmit: (e: FormEvent) => void;
  readonly onSelectLocation: (loc: GeocodingLocation) => void;
}

function submitManualReading(
  manualAqi: string, query: string,
  onManualReading: (r: ManualAirQualityData) => void, setStatusMsg: (m: string) => void,
): void {
  const reading = createManualReading({ aqi: manualAqi, cityName: query.trim() || 'Manual Location' });
  saveManualReading(reading);
  onManualReading(reading);
  setStatusMsg(`Using ${reading.sourceLabel}: AQI ${reading.aqi}`);
}

function useDebouncedSearch(
  setResults: (r: GeocodingLocation[]) => void, setStatusMsg: (m: string) => void, setShowManual: (v: boolean) => void,
): { runSearch: (term: string) => Promise<void>; debouncedRef: React.MutableRefObject<DebouncedFunction<[string]> | null>; cancelSearch: () => void } {
  const searchAbortRef = useRef<AbortController | null>(null);
  const debouncedRef = useRef<DebouncedFunction<[string]> | null>(null);
  const runSearch = useCallback(async (term: string): Promise<void> => {
    searchAbortRef.current?.abort();
    const c = new AbortController();
    searchAbortRef.current = c;
    await executeLocationSearch({ term, signal: c.signal, onResults: setResults, onStatus: setStatusMsg, onErrorFallback: () => setShowManual(true) });
  }, [setResults, setStatusMsg, setShowManual]);
  useEffect(() => {
    const d = debounce((val: string) => { void runSearch(val); }, 300);
    debouncedRef.current = d;
    return () => { d.cancel(); searchAbortRef.current?.abort(); };
  }, [runSearch]);
  return { runSearch, debouncedRef, cancelSearch: () => { debouncedRef.current?.cancel(); searchAbortRef.current?.abort(); } };
}

function useCoordsLoader(opts: {
  onLiveData: (aq: AirQualityData, fc: ForecastData | null, label: string) => void;
  onSwitchToLive?: () => void;
  setStatusMsg: (m: string) => void;
  setResults: (r: GeocodingLocation[]) => void;
  setShowManual: (v: boolean) => void;
}): (lat: number, lon: number, label: string, resolveCity?: boolean) => Promise<void> {
  const dataAbortRef = useRef<AbortController | null>(null);
  useEffect(() => () => { dataAbortRef.current?.abort(); }, []);
  return async (lat: number, lon: number, label: string, resolveCity = false): Promise<void> => {
    dataAbortRef.current?.abort();
    const c = new AbortController();
    dataAbortRef.current = c;
    opts.onSwitchToLive?.();
    opts.setStatusMsg(resolveCity ? 'Fetching live air quality for your location...' : `Fetching live air quality for ${label}...`);
    await executeCoordsFetch({
      lat, lon, label, signal: c.signal, resolveCityFromCoords: resolveCity, onLiveData: opts.onLiveData,
      onSuccess: (msg) => { opts.setStatusMsg(msg); opts.setResults([]); opts.setShowManual(false); },
      onErrorFallback: (msg) => { opts.setStatusMsg(msg); opts.setShowManual(true); },
    });
  };
}

/**
 * Manages debounced city search, reverse-geocoded geolocation, and manual AQI fallback.
 *
 * @param opts - Live data, manual reading, and optional mode switch callbacks.
 * @returns Shared live location state and handlers.
 */
export function useLiveLocation(opts: {
  onLiveData: (aq: AirQualityData, fc: ForecastData | null, label: string) => void;
  onManualReading: (reading: ManualAirQualityData) => void;
  onSwitchToLive?: () => void;
}): LiveLocationState {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<GeocodingLocation[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [showManual, setShowManual] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [manualAqi, setManualAqi] = useState<string>('180');
  const { runSearch, debouncedRef, cancelSearch } = useDebouncedSearch(setResults, setStatusMsg, setShowManual);
  const loadCoords = useCoordsLoader({ onLiveData: opts.onLiveData, onSwitchToLive: opts.onSwitchToLive, setStatusMsg, setResults, setShowManual });

  const handleGeo = async (): Promise<void> => {
    opts.onSwitchToLive?.();
    setIsLocating(true);
    try {
      const c = await getCurrentPosition();
      await loadCoords(c.lat, c.lon, `${c.lat}, ${c.lon}`, true);
    } catch (e) {
      setStatusMsg(handleGeolocationDenied(e as { error?: string; message?: string }).reason);
    } finally {
      setIsLocating(false);
    }
  };

  return {
    query, results, statusMsg, showManual, isLocating, manualAqi,
    onQueryChange: (val) => { setQuery(val); if (!val.trim()) { cancelSearch(); setResults([]); return; } debouncedRef.current?.(val); },
    onSearchSubmit: () => { debouncedRef.current?.cancel(); if (query.trim()) { opts.onSwitchToLive?.(); void runSearch(query); } },
    onGeo: () => { void handleGeo(); },
    onToggleManual: () => setShowManual((s) => !s),
    onChangeManualAqi: setManualAqi,
    onManualSubmit: (e) => { e.preventDefault(); submitManualReading(manualAqi, query, opts.onManualReading, setStatusMsg); },
    onSelectLocation: (loc) => { void loadCoords(loc.latitude, loc.longitude, loc.displayName); },
  };
}
