// Unit tests for cleaner hours counter domain calculation.
import { describe, it, expect } from 'vitest';
import { computeCleanerHours } from './cleanerHours.js';
import type { HourlyAirQualityPoint } from '../services/openMeteo.types.js';

describe('Cleaner Hours Domain Calculation', () => {
  it('correctly counts hours below threshold in a mixed hourly series', () => {
    const points: HourlyAirQualityPoint[] = [
      { time: '2026-11-26T01:00', aqi: 180, pm2_5: 90, category: 'Moderate', isEstimate: true },
      { time: '2026-11-26T02:00', aqi: 85, pm2_5: 35, category: 'Satisfactory', isEstimate: true },
      { time: '2026-11-26T03:00', aqi: 95, pm2_5: 40, category: 'Satisfactory', isEstimate: true },
      { time: '2026-11-26T04:00', aqi: 220, pm2_5: 115, category: 'Poor', isEstimate: true },
    ];
    const res = computeCleanerHours(points, 100);
    expect(res.cleanHoursCount).toBe(2);
    expect(res.totalHours).toBe(4);
    expect(res.percentage).toBe(50);
    expect(res.summary).toContain('2 of the 4 evaluated hours are below 100 AQI');
  });

  it('handles empty points cleanly with 0 count and clear message', () => {
    const res = computeCleanerHours([], 100);
    expect(res.cleanHoursCount).toBe(0);
    expect(res.totalHours).toBe(0);
    expect(res.summary).toContain('No hourly forecast data available');
  });
});
