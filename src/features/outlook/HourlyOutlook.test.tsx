// View toggle and accessibility tests for HourlyOutlook component.
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { HourlyOutlook } from './HourlyOutlook.js';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';

const mockHourlyPoints: HourlyAirQualityPoint[] = Array.from({ length: 24 }, (_, i) => ({
  time: `2026-11-24T${i < 10 ? `0${i}` : i}:00`,
  aqi: i === 7 ? 460 : i === 14 ? 170 : 300,
  category: i === 14 ? 'Moderate' : 'Severe',
  pm2_5: 250,
  isEstimate: true,
}));

describe('HourlyOutlook Component', () => {
  it('renders heading, best ventilation and peak inversion window insights', () => {
    render(<HourlyOutlook points={mockHourlyPoints} />);

    expect(screen.getByText('Next 24-48h Hourly Outlook')).toBeInTheDocument();
    expect(screen.getByText(/Best Ventilation Window: 14:00/i)).toBeInTheDocument();
    expect(screen.getByText(/Peak Inversion Alert: 07:00/i)).toBeInTheDocument();
  });

  it('switches between Chart view and Table view using toggle button group', async () => {
    const user = userEvent.setup();
    render(<HourlyOutlook points={mockHourlyPoints} />);

    const chartBtn = screen.getByRole('button', { name: 'Chart View' });
    const tableBtn = screen.getByRole('button', { name: 'Table View' });

    // Defaults to chart
    expect(chartBtn).toHaveAttribute('aria-pressed', 'true');
    expect(tableBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    // Switch to table
    await user.click(tableBtn);
    expect(tableBtn).toHaveAttribute('aria-pressed', 'true');
    expect(chartBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    // Switch back to chart
    await user.click(chartBtn);
    const chartSvg = screen.getByRole('img');
    expect(chartSvg).toBeInTheDocument();
    fireEvent.mouseMove(chartSvg, { clientX: 120, clientY: 50 });
    fireEvent.mouseLeave(chartSvg);
  });

  it('renders nothing when points array is empty', () => {
    const { container } = render(<HourlyOutlook points={[]} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Next 24-48h Hourly Outlook')).not.toBeInTheDocument();
    expect(screen.queryByText(/Best Ventilation Window/i)).not.toBeInTheDocument();
  });

  it('satisfies automated accessibility audits', async () => {
    const { container } = render(<HourlyOutlook points={mockHourlyPoints} />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
