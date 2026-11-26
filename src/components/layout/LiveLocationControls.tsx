// Live mode city search, geolocation trigger, and manual AQI reading fallback controls.
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { debounce, type DebouncedFunction } from '../../services/debounce.js';
import { getCurrentPosition, handleGeolocationDenied } from '../../services/geolocation.js';
import { createManualReading, saveManualReading, type ManualAirQualityData } from '../../services/manualReading.js';
import type { AirQualityData, ForecastData, GeocodingLocation } from '../../services/openMeteo.types.js';
import { Button } from '../ui/Button.js';
import { executeCoordsFetch, executeLocationSearch } from './liveLocationHelpers.js';

/** Props for LiveLocationControls component. */
export interface LiveLocationControlsProps {
  readonly onLiveData: (aq: AirQualityData, fc: ForecastData | null, label: string) => void;
  readonly onManualReading: (reading: ManualAirQualityData) => void;
}

function ManualAqiForm(props: {
  manualAqi: string;
  onChangeAqi: (val: string) => void;
  onSubmit: (e: FormEvent) => void;
}): ReactElement {
  return (
    <form onSubmit={props.onSubmit} className="flex flex-wrap items-center gap-2 pt-1">
      <label htmlFor="manual-aqi-input" className="font-semibold">Purifier/App AQI:</label>
      <input
        id="manual-aqi-input"
        type="number"
        min={0}
        max={500}
        value={props.manualAqi}
        onChange={(e) => props.onChangeAqi(e.target.value)}
        className="w-24 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1"
      />
      <Button type="submit" size="sm" variant="primary">Apply Manual Reading</Button>
    </form>
  );
}

/**
 * Provides live Open-Meteo city search, privacy-rounded geolocation, and manual AQI entry.
 *
 * @param props - Live data and manual reading callbacks.
 * @returns Live mode provider bar element.
 */
export function LiveLocationControls({ onLiveData, onManualReading }: LiveLocationControlsProps): ReactElement {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<GeocodingLocation[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [showManual, setShowManual] = useState<boolean>(false);
  const [manualAqi, setManualAqi] = useState<string>('180');
  const searchAbortRef = useRef<AbortController | null>(null);
  const dataAbortRef = useRef<AbortController | null>(null);
  const debouncedSearchRef = useRef<DebouncedFunction<[string]> | null>(null);

  const runSearch = useCallback(async (term: string): Promise<void> => {
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    await executeLocationSearch({
      term,
      signal: controller.signal,
      onResults: setResults,
      onStatus: setStatusMsg,
      onErrorFallback: () => setShowManual(true),
    });
  }, []);

  useEffect(() => {
    const debounced = debounce((val: string) => { void runSearch(val); }, 300);
    debouncedSearchRef.current = debounced;
    return () => { debounced.cancel(); searchAbortRef.current?.abort(); dataAbortRef.current?.abort(); };
  }, [runSearch]);

  const loadCoords = async (lat: number, lon: number, label: string): Promise<void> => {
    dataAbortRef.current?.abort();
    const controller = new AbortController();
    dataAbortRef.current = controller;
    setStatusMsg('Fetching live air quality...');
    await executeCoordsFetch({
      lat, lon, label, signal: controller.signal, onLiveData,
      onSuccess: (msg) => { setStatusMsg(msg); setShowManual(false); },
      onErrorFallback: (msg) => { setStatusMsg(msg); setShowManual(true); },
    });
  };

  const handleQueryChange = (val: string): void => {
    setQuery(val);
    if (!val.trim()) { debouncedSearchRef.current?.cancel(); searchAbortRef.current?.abort(); setResults([]); return; }
    debouncedSearchRef.current?.(val);
  };

  const handleGeo = async (): Promise<void> => {
    try { const coords = await getCurrentPosition(); await loadCoords(coords.lat, coords.lon, `${coords.lat}, ${coords.lon}`); }
    catch (err) { setStatusMsg(handleGeolocationDenied(err as { error?: string; message?: string }).reason); }
  };

  const handleManualSubmit = (e: FormEvent): void => {
    e.preventDefault();
    const reading = createManualReading({ aqi: manualAqi, cityName: query.trim() || 'Manual Location' });
    saveManualReading(reading);
    onManualReading(reading);
    setStatusMsg(`Using ${reading.sourceLabel}: AQI ${reading.aqi}`);
  };

  return (
    <div className="space-y-2 text-xs">
      <form onSubmit={(e) => { e.preventDefault(); debouncedSearchRef.current?.cancel(); if (query.trim()) void runSearch(query); }} className="flex flex-wrap items-center gap-2">
        <label htmlFor="live-city-search" className="sr-only">Search city for live AQI</label>
        <input id="live-city-search" type="text" maxLength={100} value={query} onChange={(e) => handleQueryChange(e.target.value)} placeholder="Search city (e.g., Delhi, Kanpur)" className="flex-1 min-w-[180px] rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 py-1.5" />
        <Button type="submit" size="sm" variant="primary">Search</Button>
        <Button size="sm" variant="outline" onClick={() => void handleGeo()}>Use My Location</Button>
        <Button size="sm" variant="ghost" onClick={() => setShowManual((s) => !s)}>{showManual ? 'Hide Manual' : 'Manual AQI'}</Button>
      </form>
      {results.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {results.slice(0, 5).map((loc) => <Button key={loc.id} size="sm" variant="secondary" onClick={() => void loadCoords(loc.latitude, loc.longitude, loc.displayName)}>{loc.displayName}</Button>)}
        </div>
      )}
      {showManual && <ManualAqiForm manualAqi={manualAqi} onChangeAqi={setManualAqi} onSubmit={handleManualSubmit} />}
      {statusMsg && <p role="status" className="text-neutral-600 dark:text-neutral-400">{statusMsg}</p>}
    </div>
  );
}