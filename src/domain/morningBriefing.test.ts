// Unit tests for Morning Briefing domain engine generating city summaries and share text.
import { describe, it, expect } from 'vitest';
import { generateMorningBriefing } from './morningBriefing.js';
import type { HourlyAirQualityPoint } from '../services/openMeteo.types.js';

describe('Morning Briefing Domain Engine', () => {
  it('generates severe emergency briefing with cancellation advice and N95 directives', () => {
    const briefing = generateMorningBriefing({
      city: 'Delhi',
      aqi: 440,
      category: 'Severe',
      vulnerability: 'respiratory',
    });

    expect(briefing.city).toBe('Delhi');
    expect(briefing.aqi).toBe(440);
    expect(briefing.category).toBe('Severe');
    expect(briefing.commuteSafety).toContain('Avoid two-wheelers');
    expect(briefing.schoolAdvice).toContain('assemblies and sports periods must be cancelled');
    expect(briefing.checklist).toHaveLength(3);
    expect(briefing.checklist[2]).toContain('rescue inhalers');
    expect(briefing.shareText).toContain('Saans Morning Briefing for Delhi');
    expect(briefing.shareText).toContain('✓');
  });

  it('detects forecast evening peak timing from hourly points', () => {
    const points: HourlyAirQualityPoint[] = [
      { time: '2026-11-26T12:00', aqi: 200, pm2_5: 110, category: 'Poor', isEstimate: true },
      { time: '2026-11-26T21:00', aqi: 480, pm2_5: 350, category: 'Severe', isEstimate: true },
    ];
    const briefing = generateMorningBriefing({
      city: 'Kanpur',
      aqi: 320,
      category: 'Severe',
      hourlyPoints: points,
    });
    expect(briefing.eveningPeak).toContain('21:00');
    expect(briefing.eveningPeak).toContain('480');
  });

  it('generates encouraging briefing during Good ambient air quality', () => {
    const briefing = generateMorningBriefing({
      city: 'Bengaluru',
      aqi: 42,
      category: 'Good',
    });
    expect(briefing.commuteSafety).toContain('Normal commute conditions');
    expect(briefing.schoolAdvice).toContain('Outdoor school activities and playtime permitted');
    expect(briefing.checklist[0]).toContain('open windows');
  });
});
