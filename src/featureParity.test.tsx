// Comprehensive Feature Parity test asserting all core entry points exist by role and accessible name.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App.js';

describe('Phase B Feature Parity Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    document.documentElement.className = '';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ configured: true }),
    } as Response);
  });

  it('mounts App and verifies all mandatory feature entry points exist by role and accessible name', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Header & Global Controls
    expect(screen.getByRole('button', { name: /Current mode is/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Switch to (dark|light) theme/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Switch language/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tour' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();

    // Welcome actions
    expect(screen.getByRole('button', { name: '1-Click Demo Launch' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set Up Family Profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guided Tour' })).toBeInTheDocument();

    // Navigation Tabs / Links
    expect(screen.getByRole('tab', { name: /Today/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Daily Routine/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Indoor Hacks/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Impact Explainer/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Assistant/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Community Kit/i })).toBeInTheDocument();

    // Today Dashboard Elements
    expect(screen.getByRole('heading', { level: 2, name: 'Delhi' })).toBeInTheDocument();
    expect(screen.getByText('425')).toBeInTheDocument();
    expect(screen.getByText('Severe')).toBeInTheDocument();
    expect(screen.getByText(/Criteria Pollutants Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText('Fine Particulates')).toBeInTheDocument();
    expect(screen.getByText('Coarse Particulates')).toBeInTheDocument();
    expect(screen.getByText(/Health & Regulatory Benchmarks/i)).toBeInTheDocument();
    expect(screen.getByText(/Atmospheric Mixing Factors/i)).toBeInTheDocument();

    // Hourly Outlook & Chart/Table Toggle
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Next 24-48h Hourly Outlook/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Chart View' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Table View' })).toBeInTheDocument();
    expect(screen.getByText(/Best Ventilation Window/i)).toBeInTheDocument();
    expect(screen.getByText(/Peak Inversion Alert/i)).toBeInTheDocument();

    // Family Smog Emergency Plan
    expect(screen.getByRole('heading', { name: /Family Smog Emergency Plan/i })).toBeInTheDocument();
    expect(screen.getByText(/National Emergency 112/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Print Family Smog Plan/i }).length).toBeGreaterThanOrEqual(1);

    // Footer Attribution & Status
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText(/Open-Meteo Air Quality/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy:/i)).toBeInTheDocument();
    expect(screen.getByText(/Disclaimer:/i)).toBeInTheDocument();
    expect(screen.getByTestId('ai-status')).toBeInTheDocument();

    // Switch to Live Mode to verify City Search, Location, and Manual Reading
    await user.click(screen.getByRole('button', { name: /Current mode is/i }));
    expect(screen.getByPlaceholderText(/Search city/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use My Location' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manual AQI' })).toBeInTheDocument();
  });
});
