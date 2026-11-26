// Unit and accessibility tests for CleanerHoursCard component.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { CleanerHoursCard } from './CleanerHoursCard.js';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';

describe('CleanerHoursCard Component', () => {
  it('renders cleaner hours summary and triggers manual refresh', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const points: HourlyAirQualityPoint[] = [
      { time: '2026-11-26T01:00', aqi: 80, pm2_5: 35, category: 'Satisfactory', isEstimate: true },
      { time: '2026-11-26T02:00', aqi: 150, pm2_5: 70, category: 'Moderate', isEstimate: true },
      { time: '2026-11-26T03:00', aqi: 75, pm2_5: 30, category: 'Satisfactory', isEstimate: true },
    ];

    render(<CleanerHoursCard points={points} onRefresh={onRefresh} isCached={true} />);

    expect(screen.getByText('Cleaner Air Hours (24h Retrospective)')).toBeInTheDocument();
    expect(screen.getByText(/2 of 3 evaluated hours/i)).toBeInTheDocument();
    expect(screen.getByText(/Cache Valid \(1h TTL\)/i)).toBeInTheDocument();

    const refreshBtn = screen.getByRole('button', { name: /Refresh now/i });
    await user.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('returns null when points are empty', () => {
    const { container } = render(<CleanerHoursCard points={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('satisfies automated accessibility audit', async () => {
    const points: HourlyAirQualityPoint[] = [
      { time: '2026-11-26T01:00', aqi: 80, pm2_5: 35, category: 'Satisfactory', isEstimate: true },
    ];
    const { container } = render(<CleanerHoursCard points={points} />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
