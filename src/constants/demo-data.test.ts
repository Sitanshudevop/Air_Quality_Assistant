// Unit tests for curated demo snapshots, household personas, and deep freeze immutability.
import { describe, it, expect } from 'vitest';
import {
  DEMO_PERSONAS,
  DEMO_SNAPSHOTS,
  getPersona,
  getSnapshot,
} from './demo-data.js';

describe('Curated Demo Snapshots and Personas', () => {
  it('delhi snapshot meets Severe smog criteria', () => {
    const delhi = DEMO_SNAPSHOTS.delhi;
    expect(delhi.category).toBe('Severe');
    expect(delhi.aqi).toBeGreaterThanOrEqual(400);
    expect(delhi.pollutants.pm2_5).toBeGreaterThanOrEqual(250);
    expect(delhi.weather.temperature).toBeDefined();
    expect(delhi.weather.windSpeed).toBeLessThanOrEqual(1.5);
  });

  it('lucknow snapshot meets Poor category criteria', () => {
    const lucknow = DEMO_SNAPSHOTS.lucknow;
    expect(lucknow.category).toBe('Poor');
    expect(lucknow.aqi).toBe(260);
  });

  it('mumbai snapshot meets Moderate category criteria', () => {
    const mumbai = DEMO_SNAPSHOTS.mumbai;
    expect(mumbai.category).toBe('Moderate');
    expect(mumbai.aqi).toBe(135);
  });

  it('bengaluru snapshot meets Good or Satisfactory criteria', () => {
    const bengaluru = DEMO_SNAPSHOTS.bengaluru;
    expect(['Good', 'Satisfactory']).toContain(bengaluru.category);
    expect(bengaluru.aqi).toBeLessThanOrEqual(100);
  });

  it('provides 48 hours of projected hourly air quality and weather in all snapshots', () => {
    for (const city of ['delhi', 'lucknow', 'mumbai', 'bengaluru'] as const) {
      const snap = DEMO_SNAPSHOTS[city];
      expect(snap.hourlyAirQuality.length).toBe(48);
      expect(snap.hourlyWeather.length).toBe(48);
      expect(snap.hourly?.pm2_5.length).toBe(48);
      expect(snap.source).toBe('curated frozen demo snapshot');
    }
  });

  it('enforces deep freeze immutability across snapshots and personas', () => {
    expect(Object.isFrozen(DEMO_SNAPSHOTS)).toBe(true);
    expect(Object.isFrozen(DEMO_SNAPSHOTS.delhi)).toBe(true);
    expect(Object.isFrozen(DEMO_SNAPSHOTS.delhi.pollutants)).toBe(true);
    expect(Object.isFrozen(DEMO_PERSONAS)).toBe(true);
    expect(Object.isFrozen(DEMO_PERSONAS.toddler_grandparent)).toBe(true);
  });

  it('retrieves snapshots by ID and falls back to Delhi for unknown city', () => {
    const mumbai = getSnapshot('mumbai');
    expect(mumbai.cityId).toBe('mumbai');

    const fallback = getSnapshot('unknown_city_xyz');
    expect(fallback.cityId).toBe('delhi');
  });

  it('contains 3 distinct curated household personas', () => {
    expect(DEMO_PERSONAS.toddler_grandparent.vulnerabilities).toContain('child');
    expect(DEMO_PERSONAS.toddler_grandparent.vulnerabilities).toContain('asthmatic');
    expect(DEMO_PERSONAS.commuter_couple.transitMode).toBe('two-wheeler');
    expect(DEMO_PERSONAS.school_rwa.vulnerabilities).toContain('elderly');
  });

  it('retrieves personas and isolates mutation across switches', () => {
    const p1 = getPersona('toddler_grandparent');
    const p2 = getPersona('commuter_couple');
    expect(p1.id).not.toBe(p2.id);

    const fallback = getPersona('unknown_id');
    expect(fallback.id).toBe('toddler_grandparent');
  });
});
