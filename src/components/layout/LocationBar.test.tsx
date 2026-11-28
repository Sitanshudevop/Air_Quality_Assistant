// Unit and accessibility tests for LocationBar and LiveLocationControls.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import * as geocoding from '../../services/geocoding.js';
import * as airQuality from '../../services/airQuality.js';
import * as forecast from '../../services/forecast.js';
import * as geolocation from '../../services/geolocation.js';
import { LocationBar } from './LocationBar.js';

describe('LocationBar & LiveLocationControls', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('switches demo city and persona without network calls', async () => {
    const onCity = vi.fn();
    const onPersona = vi.fn();
    const user = userEvent.setup();
    render(
      <LocationBar
        isDemo={true}
        demoCityId="delhi"
        demoPersonaId="toddler_grandparent"
        onSelectDemoCity={onCity}
        onSelectDemoPersona={onPersona}
        onLiveData={vi.fn()}
        onManualReading={vi.fn()}
      />
    );

    await user.selectOptions(screen.getByLabelText(/Demo City/i), 'lucknow');
    expect(onCity).toHaveBeenCalledWith('lucknow');

    await user.selectOptions(screen.getByLabelText(/Household Persona/i), 'commuter_couple');
    expect(onPersona).toHaveBeenCalledWith('commuter_couple');
  });

  it('searches live city, handles geolocation denial, and applies manual AQI fallback', async () => {
    vi.spyOn(geocoding, 'searchLocations').mockResolvedValueOnce([
      { id: 1, name: 'Kanpur', latitude: 26.45, longitude: 80.33, displayName: 'Kanpur, UP, India' },
    ]);
    vi.spyOn(airQuality, 'fetchAirQuality').mockRejectedValueOnce(new Error('Offline'));
    vi.spyOn(forecast, 'fetchForecast').mockRejectedValueOnce(new Error('Offline'));
    vi.spyOn(geolocation, 'getCurrentPosition').mockRejectedValueOnce({ error: 'PERMISSION_DENIED' });

    const onManual = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <LocationBar
        isDemo={false}
        demoCityId="delhi"
        demoPersonaId="toddler_grandparent"
        onSelectDemoCity={vi.fn()}
        onSelectDemoPersona={vi.fn()}
        onLiveData={vi.fn()}
        onManualReading={onManual}
      />
    );

    const searchInput = screen.getByLabelText(/Search city/i);
    expect(searchInput).toHaveAttribute('maxLength', '100');
    await user.type(searchInput, 'Kanpur');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Kanpur, UP, India' })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Kanpur, UP, India' }));
    await waitFor(() => expect(screen.getByLabelText(/Purifier\/App AQI/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Apply Manual Reading/i }));
    expect(onManual).toHaveBeenCalledWith(expect.objectContaining({ sourceLabel: 'user-entered reading' }));

    await user.click(screen.getByRole('button', { name: /Use My Location/i }));
    await waitFor(() => expect(screen.getByText(/Location access denied/i)).toBeInTheDocument());
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it('handles live coords success, empty/zero/failed search, geolocation success, manual toggle, and debounce abort', async () => {
    const mockAq = {
      latitude: 28.61, longitude: 77.21, currentAqi: 185, currentCategory: 'Moderate' as const,
      dominantPollutant: 'PM2.5' as const, isEstimate: true as const,
      pollutants: { pm2_5: 85 }, hourly: [], source: 'Open-Meteo CAMS' as const, fetchedAt: '2026-11-26T00:00:00Z',
    };
    const searchSpy = vi.spyOn(geocoding, 'searchLocations')
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('Search down'))
      .mockResolvedValueOnce([{ id: 2, name: 'Delhi', latitude: 28.61, longitude: 77.21, displayName: 'Delhi, India' }]);
    vi.spyOn(airQuality, 'fetchAirQuality').mockResolvedValue(mockAq);
    vi.spyOn(forecast, 'fetchForecast').mockRejectedValue(new Error('No forecast'));
    vi.spyOn(geolocation, 'getCurrentPosition').mockResolvedValueOnce({ lat: 28.61, lon: 77.21 });
    vi.spyOn(geocoding, 'reverseGeocode').mockResolvedValueOnce('New Delhi, Delhi');

    const onLiveData = vi.fn();
    const user = userEvent.setup();
    const { unmount } = render(
      <LocationBar
        isDemo={false} demoCityId="delhi" demoPersonaId="toddler_grandparent"
        onSelectDemoCity={vi.fn()} onSelectDemoPersona={vi.fn()}
        onLiveData={onLiveData} onManualReading={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(searchSpy).not.toHaveBeenCalled();

    const searchInput = screen.getByLabelText(/Search city/i);
    await user.type(searchInput, 'Nowhere');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText(/No matching cities found/i)).toBeInTheDocument());

    await user.clear(searchInput);
    await user.type(searchInput, 'OfflineCity');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText(/City search offline/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Hide Manual' }));
    expect(screen.queryByLabelText(/Purifier\/App AQI/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Use My Location/i }));
    await waitFor(() => expect(onLiveData).toHaveBeenCalledWith(mockAq, null, 'New Delhi, Delhi'));

    await user.clear(searchInput);
    await user.type(searchInput, 'Delhi');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delhi, India' })).toBeInTheDocument(), { timeout: 4000 });
    unmount();
  }, 15000);
});
