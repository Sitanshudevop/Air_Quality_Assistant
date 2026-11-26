// Integration and accessibility tests for TodayDashboard component.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { TodayDashboard } from './TodayDashboard.js';

describe('TodayDashboard Component', () => {
  it('renders all aggregated dashboard sections and source attribution', () => {
    render(
      <TodayDashboard
        cityName="Lucknow, UP"
        aqi={320}
        category="Very Poor"
        sourceLabel="Open-Meteo Air Quality API"
        timestamp="24 Nov 2026, 10:00 IST"
        pollutants={{ pm2_5: 180, pm10: 250 }}
        weatherFactors={{ temperature: 20, humidity: 65, windSpeed: 2.1 }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Lucknow, UP' })).toBeInTheDocument();
    expect(screen.getAllByText(/Source: Open-Meteo Air Quality API/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('320')).toBeInTheDocument();
    expect(screen.getByText('Very Poor')).toBeInTheDocument();
    expect(screen.getByText(/Criteria Pollutants Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Health & Regulatory Benchmarks/i)).toBeInTheDocument();
    expect(screen.getByText(/Atmospheric Mixing Factors/i)).toBeInTheDocument();
  });

  it('renders designed empty state with no dummy numbers, categories, or benchmarks when data is empty', () => {
    const onSearch = vi.fn();
    const onLoc = vi.fn();
    const onManual = vi.fn();
    const onDemo = vi.fn();

    render(
      <TodayDashboard
        status="empty"
        onFocusSearch={onSearch}
        onUseLocation={onLoc}
        onManualReading={onManual}
        onLaunchDemo={onDemo}
      />
    );

    expect(
      screen.getByText('Choose a city, use your location, or enter a reading to see live air quality')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search City' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use Location' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enter a Reading' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try the demo' })).toBeInTheDocument();

    // Assert NO fake numbers, categories, or benchmark claims appear
    expect(screen.queryByText(/Estimated CPCB AQI 0/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Good')).not.toBeInTheDocument();
    expect(screen.queryByText('Within guideline')).not.toBeInTheDocument();
    expect(screen.queryByText(/Best Ventilation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Peak Inversion/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Criteria Pollutants Breakdown/i)).not.toBeInTheDocument();
  });

  it('renders skeleton loader when status is loading', () => {
    render(<TodayDashboard status="loading" />);
    expect(screen.getByRole('status', { name: 'Loading air quality data' })).toHaveAttribute(
      'aria-busy',
      'true'
    );
  });

  it('renders error state with retry and manual reading options', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onManual = vi.fn();

    render(
      <TodayDashboard
        status="error"
        errorMessage="Open-Meteo connection timed out."
        onRetry={onRetry}
        onManualReading={onManual}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Open-Meteo connection timed out.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry Request' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Enter Manual Reading' }));
    expect(onManual).toHaveBeenCalledTimes(1);
  });

  it('renders user-entered reading label when in manual fallback mode', () => {
    render(
      <TodayDashboard
        status="ready"
        sourceLabel="user-entered reading"
        aqi={180}
        category="Moderate"
        cityName="Noida"
      />
    );
    expect(screen.getByText('Source: user-entered reading')).toBeInTheDocument();
    expect(screen.getByText('180')).toBeInTheDocument();
  });

  it('satisfies automated accessibility audits in empty and ready states', async () => {
    const { container, rerender } = render(<TodayDashboard status="empty" />);
    const emptyResults = await axe(container);
    expect(emptyResults.violations).toHaveLength(0);

    rerender(
      <TodayDashboard
        status="ready"
        cityName="Delhi"
        aqi={425}
        category="Severe"
        pollutants={{ pm2_5: 380, pm10: 510 }}
        weatherFactors={{ temperature: 16, humidity: 82 }}
      />
    );
    const readyResults = await axe(container);
    expect(readyResults.violations).toHaveLength(0);
  });
});
