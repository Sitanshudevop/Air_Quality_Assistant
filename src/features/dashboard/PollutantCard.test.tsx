// Rendering and accessibility tests for PollutantCard component.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { PollutantCard } from './PollutantCard.js';

describe('PollutantCard Component', () => {
  it('renders all 6 criteria pollutants with values and standardized units', () => {
    render(
      <PollutantCard
        values={{
          pm2_5: 382.4,
          pm10: 512.1,
          no2: 84.2,
          so2: 12.5,
          co: 2.4,
          o3: 45.0,
        }}
      />
    );

    expect(screen.getByText('PM2.5')).toBeInTheDocument();
    expect(screen.getByText('382.4')).toBeInTheDocument();
    expect(screen.getByText('PM10')).toBeInTheDocument();
    expect(screen.getByText('512.1')).toBeInTheDocument();
    expect(screen.getByText('CO')).toBeInTheDocument();
    expect(screen.getByText('2.4')).toBeInTheDocument();
    expect(screen.getByText('mg/m³')).toBeInTheDocument();
  });

  it('renders dashes for missing or undefined pollutant values gracefully', () => {
    render(
      <PollutantCard
        values={{
          pm2_5: 120,
          so2: undefined,
          o3: null,
        }}
      />
    );
    expect(screen.getByText('120')).toBeInTheDocument();
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('satisfies automated accessibility audits', async () => {
    const { container } = render(
      <PollutantCard
        values={{
          pm2_5: 45,
          pm10: 80,
          no2: 30,
          so2: 10,
          co: 1.2,
          o3: 50,
        }}
      />
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
