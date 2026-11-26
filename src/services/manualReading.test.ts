// Unit tests for manual purifier/app reading fallback and inverse estimation.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearManualReading,
  createManualReading,
  createManualReadingFromPm25,
  getManualReading,
  saveManualReading,
} from './manualReading.js';

describe('Manual Reading Entry Fallback', () => {
  beforeEach(() => {
    clearManualReading();
  });

  it('creates manual reading with mandatory "user-entered reading" label', () => {
    const reading = createManualReading({ aqi: 280 });
    expect(reading.sourceLabel).toBe('user-entered reading');
    expect(reading.source).toBe('user-entered reading');
    expect(reading.aqi).toBe(280);
    expect(reading.category).toBe('Poor');
    expect(reading.pm25).toBeGreaterThan(90);
    expect(reading.isEstimate).toBe(true);
  });

  it('derives AQI and category from PM2.5 numerical input', () => {
    const reading = createManualReadingFromPm25(180, 'Dwarka Home');
    expect(reading.category).toBe('Very Poor');
    expect(reading.aqi).toBeGreaterThan(300);
    expect(reading.cityName).toBe('Dwarka Home');
  });

  it('clamps negative AQI inputs to zero with Good category', () => {
    const reading = createManualReading({ aqi: -50 });
    expect(reading.aqi).toBe(0);
    expect(reading.category).toBe('Good');
    expect(reading.pm25).toBe(0);
  });

  it('clamps extreme AQI inputs (>999) to 500 Severe', () => {
    const reading = createManualReading({ aqi: 1500 });
    expect(reading.aqi).toBe(500);
    expect(reading.category).toBe('Severe');
    expect(reading.pm25).toBe(500);
  });

  it('handles non-numeric or malformed string payloads safely', () => {
    const reading = createManualReading({ aqi: 'bad-input' });
    expect(reading.aqi).toBe(0);
    expect(reading.category).toBe('Good');
  });

  it('treats zero reading (AQI = 0) as valid Good category', () => {
    const reading = createManualReading({ aqi: 0 });
    expect(reading.aqi).toBe(0);
    expect(reading.category).toBe('Good');
  });

  it('delegates to PM2.5 calculation when only pm25 is provided in input', () => {
    const reading = createManualReading({ pm25: 75 });
    expect(reading.pm25).toBe(75);
    expect(reading.category).toBe('Moderate');
  });

  it('persists, retrieves, and clears manual readings', () => {
    expect(getManualReading()).toBeNull();

    const reading = createManualReading({ aqi: 150 });
    saveManualReading(reading);
    expect(getManualReading()?.aqi).toBe(150);

    clearManualReading();
    expect(getManualReading()).toBeNull();
  });

  it('clears tampered JSON and schema-invalid sessionStorage payloads on getManualReading', () => {
    clearManualReading();
    window.sessionStorage.setItem('saans_manual_reading', '{');
    expect(getManualReading()).toBeNull();
    expect(window.sessionStorage.getItem('saans_manual_reading')).toBeNull();

    window.sessionStorage.setItem('saans_manual_reading', JSON.stringify({ aqi: 999, pm25: 10 }));
    expect(getManualReading()).toBeNull();
    expect(window.sessionStorage.getItem('saans_manual_reading')).toBeNull();
  });

  it('hydrates valid persisted JSON from sessionStorage after memory reset', () => {
    const reading = createManualReading({ aqi: 180, cityName: 'Noida' });
    clearManualReading();
    window.sessionStorage.setItem('saans_manual_reading', JSON.stringify(reading));
    expect(getManualReading()).toEqual(reading);
  });

  it('rejects and purges whitespace-only cityName in sessionStorage', () => {
    clearManualReading();
    const whitespaceReading = { ...createManualReading({ aqi: 42 }), cityName: '   ' };
    window.sessionStorage.setItem('saans_manual_reading', JSON.stringify(whitespaceReading));
    expect(getManualReading()).toBeNull();
    expect(window.sessionStorage.getItem('saans_manual_reading')).toBeNull();

    window.sessionStorage.setItem(
      'saans_manual_reading',
      JSON.stringify({
        cityName: '   ',
        aqi: 42,
        pm25: 10,
        updatedAt: new Date().toISOString(),
        source: 'manual',
      })
    );
    expect(getManualReading()).toBeNull();
    expect(window.sessionStorage.getItem('saans_manual_reading')).toBeNull();
  });
});
