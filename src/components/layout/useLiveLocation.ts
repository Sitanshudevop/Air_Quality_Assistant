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
  manualAqi: string,
  query: string,
  onManualReading: (r: ManualAirQualityData) => void,
  setStatusMsg: (m: string) => void,
): void {
  const reading = createManualReading({ aqi: manualAqi, cityName: query.trim() || 'Manual Location' });
  saveManualReading(reading);
  onManualReading(reading);
  setStatusMsg(`Using ${reading.sourceLabel}: AQI ${reading.aqi}`);
}

function useDebouncedSearch(
  setResults: (r: GeocodingLocation[]) => void,
  setStatusMsg: (m: string) => void,
  setShowManual: (v: boolean) => void,
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

/**
 * Manages debounced city search, privacy-rounded geolocation, and manual AQI fallback.
 *
 * @param opts - Live data, manual reading, and optional mode switch callbacks.
 * @returns Shared live location state and handlers.
 */
export function useLiveLocation(opts: {
  onLiveData: (aq: AirQualityData, fc: ForecastData | null, label: string) => void;
  onManualReading: (reading: ManualAirQualityData) => void;
  onSwitchToLive?: () => void;
}): LiveLocationState {
  const { onLiveData, onManualReading, onSwitchToLive } = opts;
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<GeocodingLocation[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [showManual, setShowManual] = useState<boolean>(false);
  const [manualAqi, setManualAqi] = useState<string>('180');
  const dataAbortRef = useRef<AbortController | null>(null);
  const { runSearch, debouncedRef, cancelSearch } = useDebouncedSearch(setResults, setStatusMsg, setShowManual);

  useEffect(() => () => { dataAbortRef.current?.abort(); }, []);

  const loadCoords = async (lat: number, lon: number, label: string): Promise<void> => {
    dataAbortRef.current?.abort();
    const c = new AbortController();
    dataAbortRef.current = c;
    onSwitchToLive?.();
    setStatusMsg('Fetching live air quality...');
    await executeCoordsFetch({
      lat, lon, label, signal: c.signal, onLiveData,
      onSuccess: (msg) => { setStatusMsg(msg); setResults([]); setShowManual(false); },
      onErrorFallback: (msg) => { setStatusMsg(msg); setShowManual(true); },
    });
  };

  return {
    query, results, statusMsg, showManual, manualAqi,
    onQueryChange: (val) => { setQuery(val); if (!val.trim()) { cancelSearch(); setResults([]); return; } debouncedRef.current?.(val); },
    onSearchSubmit: () => { debouncedRef.current?.cancel(); if (query.trim()) { onSwitchToLive?.(); void runSearch(query); } },
    onGeo: () => { onSwitchToLive?.(); void getCurrentPosition().then((c) => loadCoords(c.lat, c.lon, `${c.lat}, ${c.lon}`)).catch((e: { error?: string; message?: string }) => setStatusMsg(handleGeolocationDenied(e).reason)); },
    onToggleManual: () => setShowManual((s) => !s),
    onChangeManualAqi: setManualAqi,
    onManualSubmit: (e) => { e.preventDefault(); submitManualReading(manualAqi, query, onManualReading, setStatusMsg); },
    onSelectLocation: (loc) => { void loadCoords(loc.latitude, loc.longitude, loc.displayName); },
  };
}
