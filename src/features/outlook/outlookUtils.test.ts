// Unit tests for outlook coordinates scaling, polyline, and activity window logic.
import { describe, it, expect } from 'vitest';
import type { HourlyAirQualityPoint } from '../../services/openMeteo.types.js';
import {
  formatHour,
  computeSvgCoordinates,
  generatePolylinePoints,
  findActivityWindows,
  getOutlookSummary,
  CHART_WIDTH,
  CHART_HEIGHT,
} from './outlookUtils.js';
import { buildSmoothCurvePath, buildSmoothAreaPath, categoryPillClass } from './chartSpline.js';

function makeMockPoint(hour: number, aqi: number): HourlyAirQualityPoint {
  const pad = hour < 10 ? `0${hour}` : `${hour}`;
  return {
    time: `2026-11-24T${pad}:00`,
    aqi,
    category: aqi > 300 ? 'Severe' : aqi > 100 ? 'Moderate' : 'Good',
    pm2_5: aqi * 0.9,
    isEstimate: true,
  };
}

describe('outlookUtils', () => {
  it('formats hours from ISO timestamps', () => {
    expect(formatHour('2026-11-24T14:30')).toBe('14:30');
    expect(formatHour('08:00')).toBe('08:00');
    expect(formatHour('')).toBe('00:00');
  });

  it('computes SVG coordinates within bounds for 24 hourly points', () => {
    const points = Array.from({ length: 24 }, (_, i) => makeMockPoint(i, 200));
    const coords = computeSvgCoordinates(points);

    expect(coords).toHaveLength(24);
    expect(coords[0]?.x).toBe(45); // Left padding
    expect(coords[23]?.x).toBe(CHART_WIDTH - 20); // Right padding
    expect(coords[0]?.y).toBeGreaterThan(0);
    expect(coords[0]?.y).toBeLessThan(CHART_HEIGHT);
  });

  it('handles empty points array without error returning null windows and summary', () => {
    expect(computeSvgCoordinates([])).toEqual([]);
    expect(generatePolylinePoints([])).toBe('');
    expect(findActivityWindows([])).toBeNull();
    expect(getOutlookSummary([])).toContain('No hourly forecast');
  });

  it('generates valid polyline coordinate string', () => {
    const points = [makeMockPoint(0, 100), makeMockPoint(12, 250), makeMockPoint(23, 400)];
    const polyline = generatePolylinePoints(points);

    expect(polyline).toContain(',');
    const parts = polyline.split(' ');
    expect(parts).toHaveLength(3);
  });

  it('identifies best and worst ventilation windows based on minimum and maximum AQI', () => {
    const points = [
      makeMockPoint(6, 450), // Peak early morning
      makeMockPoint(14, 180), // Lowest afternoon
      makeMockPoint(20, 380),
    ];

    const windows = findActivityWindows(points);
    expect(windows).not.toBeNull();
    expect(windows?.best.hourLabel).toBe('14:00');
    expect(windows?.best.aqi).toBe(180);
    expect(windows?.worst.hourLabel).toBe('06:00');
    expect(windows?.worst.aqi).toBe(450);
  });

  it('handles flat uniform AQI values safely without division by zero', () => {
    const points = Array.from({ length: 10 }, (_, i) => makeMockPoint(i, 300));
    const coords = computeSvgCoordinates(points);
    expect(coords).toHaveLength(10);
    expect(coords[0]?.y).toBe(coords[9]?.y);
  });

  it('builds smooth spline/area paths and resolves all categoryPillClass tiers', () => {
    expect(buildSmoothCurvePath([])).toBe('');
    expect(buildSmoothAreaPath([], 100)).toBe('');
    const single = [{ x: 10, y: 20, aqi: 100, category: 'Moderate', timeLabel: '08:00' }];
    expect(buildSmoothCurvePath(single)).toBe('M 10,20');

    const multi = [
      { x: 10, y: 20, aqi: 100, category: 'Moderate', timeLabel: '08:00' },
      { x: 50, y: 40, aqi: 200, category: 'Poor', timeLabel: '10:00' },
      { x: 90, y: 10, aqi: 50, category: 'Good', timeLabel: '12:00' },
    ];
    expect(buildSmoothCurvePath(multi)).toContain('C ');
    expect(buildSmoothAreaPath(multi, 100)).toContain('L 90,100 L 10,100 Z');

    expect(categoryPillClass('Good')).toContain('emerald');
    expect(categoryPillClass('Satisfactory')).toContain('emerald');
    expect(categoryPillClass('Moderate')).toContain('amber');
    expect(categoryPillClass('Poor')).toContain('orange');
    expect(categoryPillClass('Very Poor')).toContain('rose');
    expect(categoryPillClass('Severe')).toContain('rose');
  });
});
