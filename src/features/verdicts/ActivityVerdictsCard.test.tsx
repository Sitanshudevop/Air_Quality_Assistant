// Unit and accessibility tests for ActivityVerdictsCard component.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ActivityVerdictsCard } from './ActivityVerdictsCard.js';

describe('ActivityVerdictsCard Component', () => {
  it('renders all 7 activities with appropriate verdict badges for Severe AQI', () => {
    render(
      <ActivityVerdictsCard
        aqi={420}
        category="Severe"
        vulnerability="respiratory"
      />
    );

    expect(screen.getByText('Daily Activity Verdicts')).toBeInTheDocument();
    expect(screen.getByText('Morning Walk')).toBeInTheDocument();
    expect(screen.getByText("Kids' Playground")).toBeInTheDocument();
    expect(screen.getByText('Jogging / Exercise')).toBeInTheDocument();
    expect(screen.getByText('School Run')).toBeInTheDocument();
    expect(screen.getByText('Opening Windows')).toBeInTheDocument();
    expect(screen.getByText('Drying Laundry Outside')).toBeInTheDocument();
    expect(screen.getByText('Two-Wheeler Commute')).toBeInTheDocument();

    const avoids = screen.getAllByText('Avoid');
    expect(avoids.length).toBeGreaterThanOrEqual(5);
  });

  it('renders Go badges for clean ambient air (AQI 35)', () => {
    render(<ActivityVerdictsCard aqi={35} category="Good" />);
    const goes = screen.getAllByText('Go');
    expect(goes.length).toBe(7);
  });

  it('returns null when aqi is undefined', () => {
    const { container } = render(<ActivityVerdictsCard aqi={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('passes automated accessibility audit', async () => {
    const { container } = render(<ActivityVerdictsCard aqi={220} category="Poor" />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
