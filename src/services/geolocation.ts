// Geolocation retrieval, coordinate validation, and privacy-preserving rounding.

/** Coordinates pair with latitude and longitude. */
export interface Coordinates {
  readonly lat: number;
  readonly lon: number;
}

/**
 * Rounds geographic coordinates to 2 decimal places (~1.1km privacy blur).
 *
 * @param lat - Latitude coordinate.
 * @param lon - Longitude coordinate.
 * @returns Rounded coordinates object.
 */
export function roundCoordinates(lat: number, lon: number): Coordinates {
  return {
    lat: Math.round(lat * 100) / 100,
    lon: Math.round(lon * 100) / 100,
  };
}

/**
 * Validates that latitude and longitude fall within legal geographic ranges.
 *
 * @param lat - Latitude coordinate.
 * @param lon - Longitude coordinate.
 * @returns True if coordinates are valid numbers in range.
 */
export function validateCoordinates(lat: number, lon: number): boolean {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (Number.isNaN(lat) || Number.isNaN(lon)) return false;
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Requests the browser current geolocation, returning rounded coordinates.
 *
 * @param options - Optional Geolocation API PositionOptions.
 * @returns Promise resolving to rounded coordinates.
 */
export function getCurrentPosition(
  options?: PositionOptions
): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve(roundCoordinates(pos.coords.latitude, pos.coords.longitude));
      },
      (err) => {
        reject(err);
      },
      options
    );
  });
}

/** Geolocation denial fallback descriptor directing UI to city search. */
export interface GeolocationFallback {
  readonly fallbackMode: 'city_search';
  readonly reason: string;
}

/**
 * Resolves a geolocation permission denial or error into a safe city-search fallback state.
 *
 * @param err - Optional error or permission status descriptor.
 * @returns Fallback descriptor with fallbackMode 'city_search'.
 */
export function handleGeolocationDenied(err?: {
  readonly error?: string;
  readonly code?: number;
  readonly message?: string;
}): GeolocationFallback {
  const isDenied = err?.error === 'PERMISSION_DENIED' || err?.code === 1;
  return {
    fallbackMode: 'city_search',
    reason: isDenied
      ? 'Location access denied. Please search and select your city manually.'
      : err?.message ?? 'Unable to determine location. Please use city search.',
  };
}
