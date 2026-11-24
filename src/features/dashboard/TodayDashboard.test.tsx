// Integration and accessibility tests for TodayDashboard component.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
      />
    );

    expect(screen.getByRole('heading', { name: 'Lucknow, UP' })).toBeInTheDocument();
    expect(screen.getByText(/Source: Open-Meteo Air Quality API/i)).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument();
    expect(screen.getByText('Very Poor')).toBeInTheDocument();
    expect(screen.getByText(/Criteria Pollutants Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Health & Regulatory Benchmarks/i)).toBeInTheDocument();
    expect(screen.getByText(/Atmospheric Mixing Factors/i)).toBeInTheDocument();
  });

  it('renders user-entered reading label when in manual fallback mode', () => {
    render(
      <TodayDashboard
        sourceLabel="user-entered reading"
        aqi={180}
        category="Moderate"
      />
    );
    expect(screen.getByText('Source: user-entered reading')).toBeInTheDocument();
    expect(screen.getByText('180')).toBeInTheDocument();
  });

  it('satisfies automated accessibility audits', async () => {
    const { container } = render(<TodayDashboard />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
