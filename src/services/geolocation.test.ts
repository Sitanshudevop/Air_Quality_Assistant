// Unit tests for geolocation rounding, coordinate validation, and browser API.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCurrentPosition,
  handleGeolocationDenied,
  roundCoordinates,
  validateCoordinates,
} from './geolocation.js';

describe('Geolocation Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rounds positive and negative coordinates to 2 decimal places', () => {
    const coords = roundCoordinates(28.613928, 77.209021);
    expect(coords.lat).toBe(28.61);
    expect(coords.lon).toBe(77.21);

    const negativeCoords = roundCoordinates(-33.8688197, 151.2092955);
    expect(negativeCoords.lat).toBe(-33.87);
    expect(negativeCoords.lon).toBe(151.21);
  });

  it('validates coordinates rejecting invalid numbers and out-of-range coordinates', () => {
    expect(validateCoordinates(0, 0)).toBe(true);
    expect(validateCoordinates(90, 180)).toBe(true);
    expect(validateCoordinates(-90, -180)).toBe(true);
    expect(validateCoordinates(90.1, 0)).toBe(false);
    expect(validateCoordinates(0, 180.1)).toBe(false);
    expect(validateCoordinates(NaN, 50)).toBe(false);
    expect(validateCoordinates(50, NaN)).toBe(false);
  });

  it('retrieves current position from browser navigator.geolocation and rounds result', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: 28.6139,
            longitude: 77.209,
          },
        });
      }),
    };

    vi.stubGlobal('navigator', { geolocation: mockGeolocation });

    const pos = await getCurrentPosition();
    expect(pos.lat).toBe(28.61);
    expect(pos.lon).toBe(77.21);
  });

  it('rejects with error when geolocation permission is denied or fails', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((_, error) => {
        error(new Error('User denied Geolocation'));
      }),
    };

    vi.stubGlobal('navigator', { geolocation: mockGeolocation });

    await expect(getCurrentPosition()).rejects.toThrow('User denied Geolocation');
  });

  it('rejects when navigator.geolocation is unavailable', async () => {
    vi.stubGlobal('navigator', {});
    await expect(getCurrentPosition()).rejects.toThrow('not supported');
  });

  it('returns city_search fallback on geolocation permission denial', () => {
    const denied = handleGeolocationDenied({ error: 'PERMISSION_DENIED' });
    expect(denied.fallbackMode).toBe('city_search');
    expect(denied.reason).toContain('denied');

    const generic = handleGeolocationDenied({ message: 'Timeout' });
    expect(generic.fallbackMode).toBe('city_search');
    expect(generic.reason).toBe('Timeout');
  });
});
