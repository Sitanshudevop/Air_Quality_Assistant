// Data honesty and empty state assertions across modes and tabs for App component.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App.js';
import { DEMO_BANNER_TEXT } from './state/mode.js';

describe('App Data Honesty Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    document.documentElement.className = '';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ configured: false }),
    } as Response);
  });

  it('asserts that with no data in live mode, no AQI number, category, or window text is rendered in any tab', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Switch from initial Demo mode to Live mode
    const modeBtn = screen.getByRole('button', { name: /Current mode is/i });
    await user.click(modeBtn);

    // Today tab in Live mode with no data:
    expect(
      screen.getByText('Choose a city, use your location, or enter a reading to see live air quality')
    ).toBeInTheDocument();
    expect(screen.queryByText(/Estimated CPCB AQI 0/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Best Ventilation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Peak Inversion/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Within guideline')).not.toBeInTheDocument();

    // Check Routine tab with no data
    await user.click(screen.getByRole('tab', { name: /Daily Routine/i }));
    await waitFor(() => {
      expect(screen.getByText('Daily Routine Requires Air Quality Data')).toBeInTheDocument();
      expect(screen.queryByText(/Est\. AQI/i)).not.toBeInTheDocument();
    });

    // Check Indoor tab with no data
    await user.click(screen.getByRole('tab', { name: /Indoor Hacks/i }));
    await waitFor(() => {
      expect(screen.getByText('Indoor Hacks Requires Air Quality Data')).toBeInTheDocument();
    });

    // Check Impact tab with no data
    await user.click(screen.getByRole('tab', { name: /Impact Explainer/i }));
    await waitFor(() => {
      expect(screen.getByText('Impact Explainer Requires Air Quality Data')).toBeInTheDocument();
    });

    // Check Community tab with no data
    await user.click(screen.getByRole('tab', { name: /Community Kit/i }));
    await waitFor(() => {
      expect(screen.getByText('Community Kit Requires Air Quality Data')).toBeInTheDocument();
    });
  });

  it('shows demo banner and snapshot data in demo mode, and matches timestamp', () => {
    render(<App />);

    expect(screen.getByText(DEMO_BANNER_TEXT)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Delhi' })).toBeInTheDocument();
    expect(screen.getByText('425')).toBeInTheDocument();
    expect(screen.getByText('Severe')).toBeInTheDocument();
    expect(screen.getByText('24 Nov 2026, 08:30 IST')).toBeInTheDocument();
  });

  it('switches demo cities, persona, and enters manual reading', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText(/Demo City/i), 'bengaluru');
    expect(screen.getByRole('heading', { name: 'Bengaluru' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Current mode is/i }));
    await user.click(screen.getByRole('button', { name: 'Manual AQI' }));
    await user.click(screen.getByRole('button', { name: /Apply Manual Reading/i }));
    expect(screen.getByRole('heading', { name: 'Manual Location' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '1-Click Demo Launch' }));
    expect(screen.getByText(DEMO_BANNER_TEXT)).toBeInTheDocument();
  });
});
