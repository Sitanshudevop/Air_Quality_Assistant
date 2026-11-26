// Accessibility and visual cues tests for AqiBadge component.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { AqiBadge } from './AqiBadge.js';
import type { AqiCategory } from '../../domain/types.js';

describe('AqiBadge Component', () => {
  it('renders integer AQI, category label, icon and dominant pollutant', () => {
    render(
      <AqiBadge
        aqi={345}
        category="Very Poor"
        dominantPollutant="PM2.5"
        isEstimate={true}
      />
    );
    expect(screen.getByText('345')).toBeInTheDocument();
    expect(screen.getByText('Very Poor')).toBeInTheDocument();
    expect(screen.getByText('PM2.5')).toBeInTheDocument();
    expect(screen.getByText('Estimated CPCB AQI')).toBeInTheDocument();
  });

  it('clamps negative values to 0 and caps values above 500 to 500', () => {
    const { rerender } = render(
      <AqiBadge aqi={-15} category="Good" />
    );
    expect(screen.getByText('0')).toBeInTheDocument();

    rerender(<AqiBadge aqi={750} category="Severe" />);
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('satisfies automated accessibility audits across all 6 bands', async () => {
    const { container } = render(
      <div>
        <AqiBadge aqi={25} category="Good" />
        <AqiBadge aqi={75} category="Satisfactory" />
        <AqiBadge aqi={150} category="Moderate" />
        <AqiBadge aqi={250} category="Poor" />
        <AqiBadge aqi={350} category="Very Poor" />
        <AqiBadge aqi={450} category="Severe" />
      </div>
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('guards NaN and ±Infinity inputs, renders CPCB AQI without estimate, and falls back on unknown category', () => {
    const { rerender } = render(<AqiBadge aqi={Number.NaN} category="Good" isEstimate={false} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('CPCB AQI')).toBeInTheDocument();

    rerender(<AqiBadge aqi={Number.POSITIVE_INFINITY} category={'Unknown' as AqiCategory} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();

    rerender(<AqiBadge aqi={Number.NEGATIVE_INFINITY} category="Good" />);
    expect(screen.getByText('0')).toBeInTheDocument();

    rerender(<AqiBadge aqi={1e9} category="Severe" />);
    expect(screen.getByText('500')).toBeInTheDocument();
  });
});
