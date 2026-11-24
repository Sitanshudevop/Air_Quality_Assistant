// Plain-words explanation and accessibility tests for WeatherMixingFactors.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { WeatherMixingFactors } from './WeatherMixingFactors.js';

describe('WeatherMixingFactors Component', () => {
  it('renders atmospheric factors and identifies active thermal inversion', () => {
    render(
      <WeatherMixingFactors
        factors={{
          temperature: 14,
          humidity: 88,
          windSpeed: 0.8,
          surfacePressure: 1018,
          isInversion: true,
        }}
      />
    );

    expect(screen.getByText('⚠️ Inversion Active')).toBeInTheDocument();
    expect(screen.getByText(/Thermal inversion active/i)).toBeInTheDocument();
    expect(screen.getByText('14°C')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('0.8 m/s')).toBeInTheDocument();
    expect(screen.getByText('1018 hPa')).toBeInTheDocument();
  });

  it('renders convective narrative when active wind disperses pollutants', () => {
    render(
      <WeatherMixingFactors
        factors={{
          temperature: 24,
          humidity: 40,
          windSpeed: 4.5,
          surfacePressure: 1012,
          isInversion: false,
        }}
      />
    );

    expect(screen.getByText(/Convective air movement/i)).toBeInTheDocument();
    expect(screen.queryByText(/⚠️ Inversion Active/i)).not.toBeInTheDocument();
  });

  it('renders stagnant calm wind narrative when wind <= 1.5 and humidity >= 70', () => {
    render(
      <WeatherMixingFactors
        factors={{
          temperature: 15,
          humidity: 72,
          windSpeed: 1.2,
          isInversion: false,
        }}
      />
    );

    expect(screen.getByText(/Calm wind \(< 1.5 m\/s\) and high humidity/i)).toBeInTheDocument();
  });

  it('falls back to standard weather summary when wind is moderate without inversion', () => {
    render(
      <WeatherMixingFactors
        factors={{
          temperature: 20,
          humidity: 50,
          windSpeed: 2.2,
          isInversion: false,
        }}
      />
    );

    expect(screen.getByText(/Active wind ventilation promotes healthy atmospheric dispersion/i)).toBeInTheDocument();
  });

  it('satisfies automated accessibility audits', async () => {
    const { container } = render(
      <WeatherMixingFactors
        factors={{
          temperature: 18,
          humidity: 60,
          windSpeed: 1.5,
          surfacePressure: 1015,
        }}
      />
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
