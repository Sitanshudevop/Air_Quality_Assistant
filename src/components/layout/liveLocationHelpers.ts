// Async search, air quality fetch, and AbortController helpers for live location controls.
import { fetchAirQuality } from '../../services/airQuality.js';
import { fetchForecast } from '../../services/forecast.js';
import { searchLocations } from '../../services/geocoding.js';
import type { AirQualityData, ForecastData, GeocodingLocation } from '../../services/openMeteo.types.js';
import { getErrorMessage } from '../../utils/error.js';
import { logError } from '../../utils/logger.js';

function isAbortError(err: unknown, signal: AbortSignal): boolean {
  return signal.aborted || (err instanceof DOMException && err.name === 'AbortError');
}

/**
 * Executes a cancellable geocoding search and reports results or offline fallback.
 *
 * @param opts - Search term, signal, and UI state callbacks.
 */
export async function executeLocationSearch(opts: {
  term: string;
  signal: AbortSignal;
  onResults: (locs: GeocodingLocation[]) => void;
  onStatus: (msg: string) => void;
  onErrorFallback: () => void;
}): Promise<void> {
  try {
    const locs = await searchLocations(opts.term, opts.signal);
    if (opts.signal.aborted) return;
    opts.onResults(locs);
    if (locs.length === 0) opts.onStatus('No matching cities found. Try another name or manual entry.');
  } catch (err) {
    if (isAbortError(err, opts.signal)) return;
    logError('Geocoding search failed', { action: 'searchLocations', error: getErrorMessage(err) });
    opts.onStatus('City search offline. Use manual AQI entry below.');
    opts.onErrorFallback();
  }
}

/**
 * Fetches live air quality and forecast data for coordinates with cancellation support.
 *
 * @param opts - Coordinates, label, signal, and UI callbacks.
 */
export async function executeCoordsFetch(opts: {
  lat: number;
  lon: number;
  label: string;
  signal: AbortSignal;
  onLiveData: (aq: AirQualityData, fc: ForecastData | null, label: string) => void;
  onSuccess: (msg: string) => void;
  onErrorFallback: (msg: string) => void;
}): Promise<void> {
  try {
    const [aq, fc] = await Promise.all([
      fetchAirQuality(opts.lat, opts.lon, opts.signal),
      fetchForecast(opts.lat, opts.lon, opts.signal).catch(() => null),
    ]);
    if (opts.signal.aborted) return;
    opts.onLiveData(aq, fc, opts.label);
    opts.onSuccess(`Live data loaded for ${opts.label}`);
  } catch (err) {
    if (isAbortError(err, opts.signal)) return;
    logError('Live Open-Meteo fetch failed', { action: 'loadCoords', error: getErrorMessage(err) });
    opts.onErrorFallback('Live Open-Meteo data unavailable. Enter your local purifier/app AQI below.');
  }
}
