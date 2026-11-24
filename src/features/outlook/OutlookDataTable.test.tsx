// Semantic HTML table and accessibility tests for OutlookDataTable.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { OutlookDataTable } from './OutlookDataTable.js';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';

const mockPoints: HourlyAirQualityPoint[] = [
  {
    time: '2026-11-24T06:00',
    aqi: 70,
    category: 'Good',
    pm2_5: 20,
    isEstimate: true,
  },
  {
    time: '2026-11-24T08:00',
    aqi: 380,
    category: 'Very Poor',
    pm2_5: 320,
    isEstimate: true,
  },
  {
    time: '2026-11-24T14:00',
    aqi: 180,
    category: 'Moderate',
    pm2_5: 110,
    isEstimate: true,
  },
  {
    time: '2026-11-24T18:00',
    aqi: 260,
    category: 'Poor',
    pm2_5: 0,
    isEstimate: true,
  },
];

describe('OutlookDataTable Component', () => {
  it('renders table caption, column headers, and row headers', () => {
    render(<OutlookDataTable points={mockPoints} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(
      screen.getByText('Hourly Air Quality Forecast and Activity Windows')
    ).toBeInTheDocument();

    expect(screen.getByRole('columnheader', { name: 'Time' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Est. AQI' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '08:00' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '14:00' })).toBeInTheDocument();
  });

  it('satisfies automated accessibility audits', async () => {
    const { container } = render(<OutlookDataTable points={mockPoints} />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
