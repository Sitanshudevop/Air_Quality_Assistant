// Unit tests for InsightRail atmospheric factors and emergency contacts widget.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InsightRail } from './InsightRail.js';

describe('InsightRail', () => {
  it('renders placeholder when weatherFactors is missing', () => {
    render(<InsightRail weatherFactors={null} />);
    expect(screen.getByText(/Atmospheric factors load with air quality data/i)).toBeInTheDocument();
    expect(screen.getByText('112')).toBeInTheDocument();
    expect(screen.getByText('102')).toBeInTheDocument();
  });

  it('renders weather metrics, inversion badge, and demo source label', () => {
    render(
      <InsightRail
        weatherFactors={{ temperature: 14, humidity: 85, windSpeed: 0.6, surfacePressure: 1015, isInversion: true }}
        origin="demo"
      />
    );
    expect(screen.getByText('Atmospheric Factors')).toBeInTheDocument();
    expect(screen.getByText('Inversion')).toBeInTheDocument();
    expect(screen.getByText('Source: Curated Model')).toBeInTheDocument();
    expect(screen.getByText('14°C')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('0.6 m/s')).toBeInTheDocument();
    expect(screen.getByText('1015 hPa')).toBeInTheDocument();
  });

  it('renders live Open-Meteo source when origin is live and no inversion', () => {
    render(
      <InsightRail
        weatherFactors={{ temperature: 25, humidity: 45, windSpeed: 4.5, surfacePressure: 1010, isInversion: false }}
        origin="live"
      />
    );
    expect(screen.getByText('Source: Open-Meteo')).toBeInTheDocument();
    expect(screen.queryByText('Inversion')).not.toBeInTheDocument();
  });
});
