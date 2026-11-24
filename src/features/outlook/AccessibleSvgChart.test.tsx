// SVG chart semantics and accessibility tests for AccessibleSvgChart.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { AccessibleSvgChart } from './AccessibleSvgChart.js';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';

function makeMockPoints(count: number): HourlyAirQualityPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    time: `2026-11-24T${i < 10 ? `0${i}` : i}:00`,
    aqi: 200 + Math.sin(i / 3) * 100,
    category: 'Poor' as const,
    pm2_5: 150,
    isEstimate: true,
  }));
}

describe('AccessibleSvgChart Component', () => {
  it('renders SVG with role img, accessible title and description', () => {
    const points = makeMockPoints(24);
    render(<AccessibleSvgChart points={points} />);

    const svg = screen.getByRole('img');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-labelledby', 'chart-title chart-desc');
    expect(screen.getByText(/Next 24 to 48 Hours Air Quality Outlook/i)).toBeInTheDocument();
  });

  it('renders SVG without crashing when points array is empty', () => {
    render(<AccessibleSvgChart points={[]} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('satisfies automated accessibility audits', async () => {
    const { container } = render(<AccessibleSvgChart points={makeMockPoints(24)} />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
