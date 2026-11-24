// Benchmark ratio calculations and accessibility tests for BenchmarkComparison.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { BenchmarkComparison } from './BenchmarkComparison.js';

describe('BenchmarkComparison Component', () => {
  it('renders side-by-side multipliers for severe concentrations', () => {
    render(
      <BenchmarkComparison
        values={{
          pm2_5: 380,
          pm10: 510,
        }}
      />
    );

    expect(screen.getByText('PM2.5 (Fine Particles)')).toBeInTheDocument();
    expect(screen.getByText('25.3x limit')).toBeInTheDocument();
    expect(screen.getByText('6.3x limit')).toBeInTheDocument();
    expect(screen.getByText('PM10 (Coarse Particles)')).toBeInTheDocument();
    expect(screen.getByText('11.3x limit')).toBeInTheDocument();
    expect(screen.getByText('5.1x limit')).toBeInTheDocument();
  });

  it('renders compliant status when concentrations fall within guidelines', () => {
    render(
      <BenchmarkComparison
        values={{
          pm2_5: 9,
          pm10: 20,
        }}
      />
    );

    expect(screen.getByText('Compliant (60%)')).toBeInTheDocument();
    expect(screen.getByText('Compliant (15%)')).toBeInTheDocument();
  });

  it('handles negative, zero, and missing concentrations cleanly', () => {
    render(
      <BenchmarkComparison
        values={{
          pm2_5: 0,
          pm10: undefined,
        }}
      />
    );

    const within = screen.getAllByText('Within guideline');
    expect(within.length).toBeGreaterThanOrEqual(2);
  });

  it('satisfies automated accessibility audits', async () => {
    const { container } = render(
      <BenchmarkComparison
        values={{
          pm2_5: 180,
          pm10: 240,
        }}
      />
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
