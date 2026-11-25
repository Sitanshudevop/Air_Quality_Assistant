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

    await user.type(screen.getByLabelText(/Search city/i), 'Kanpur');
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
});
