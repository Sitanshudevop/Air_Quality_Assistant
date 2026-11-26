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

  it('renders PM10 dynamic WHO/NAAQS limits, displays 0 cleanly, and guards NaN/Infinity inputs', () => {
    const { rerender } = render(<BenchmarkComparison values={{ pm2_5: 0, pm10: 0 }} />);
    expect(screen.getByText('WHO 2021 (45 µg/m³)')).toBeInTheDocument();
    expect(screen.getByText('Indian NAAQS (100 µg/m³)')).toBeInTheDocument();
    expect(screen.getAllByText('0 µg/m³')).toHaveLength(2);

    rerender(<BenchmarkComparison values={{ pm2_5: -1, pm10: Number.NaN }} />);
    expect(document.body.textContent).not.toContain('NaN');
    expect(screen.getByText('0 µg/m³')).toBeInTheDocument();
    expect(screen.getByText('— µg/m³')).toBeInTheDocument();

    rerender(<BenchmarkComparison values={{ pm2_5: Number.POSITIVE_INFINITY, pm10: 1e9 }} />);
    expect(document.body.textContent).not.toContain('Infinity');
    expect(document.body.textContent).not.toContain('NaN');
  });
});
