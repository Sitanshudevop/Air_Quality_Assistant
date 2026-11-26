// Shared storage and in-memory cache reset helper for full application data purge.
import { APP_LOCAL_STORAGE_KEYS } from '../constants/index.js';
import { getErrorMessage } from '../utils/error.js';
import { logError } from '../utils/logger.js';
import { clearAirQualityCache } from './airQuality.js';
import { clearForecastCache } from './forecast.js';
import { clearGeocodingCache } from './geocoding.js';
import { clearManualReading } from './manualReading.js';

/**
 * Purges all persisted localStorage keys, sessionStorage, and L1 in-memory service caches.
 */
export function clearAllAppStorage(): void {
  clearManualReading();
  clearAirQualityCache();
  clearForecastCache();
  clearGeocodingCache();
  try {
    if (typeof window !== 'undefined') {
      for (const key of APP_LOCAL_STORAGE_KEYS) {
        window.localStorage?.removeItem(key);
      }
      window.sessionStorage?.clear();
    }
  } catch (err) {
    logError('Failed clearing application storage', {
      action: 'clearAllAppStorage',
      error: getErrorMessage(err),
    });
  }
}
