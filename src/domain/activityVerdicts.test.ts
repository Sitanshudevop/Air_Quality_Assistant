// Unit tests for activity verdicts engine evaluating Go / Wait / Avoid recommendations.
import { describe, it, expect } from 'vitest';
import { evaluateActivityVerdicts } from './activityVerdicts.js';
import type { HourlyAirQualityPoint } from '../services/openMeteo.types.js';

describe('Activity Verdicts Domain Engine', () => {
  it('evaluates all 7 core activities as Avoid in Severe smog (> 300 AQI)', () => {
    const verdicts = evaluateActivityVerdicts(425, 'healthy_adult');
    expect(verdicts).toHaveLength(7);

    const walk = verdicts.find((v) => v.id === 'morning_walk');
    const playground = verdicts.find((v) => v.id === 'kids_playground');
    const exercise = verdicts.find((v) => v.id === 'jogging_exercise');
    const windows = verdicts.find((v) => v.id === 'opening_windows');
    const laundry = verdicts.find((v) => v.id === 'drying_laundry');
    const twoWheeler = verdicts.find((v) => v.id === 'two_wheeler_commute');

    expect(walk?.verdict).toBe('Avoid');
    expect(playground?.verdict).toBe('Avoid');
    expect(exercise?.verdict).toBe('Avoid');
    expect(windows?.verdict).toBe('Avoid');
    expect(laundry?.verdict).toBe('Avoid');
    expect(twoWheeler?.verdict).toBe('Avoid');
    expect(walk?.maskRecommendation).toContain('N95');
  });

  it('evaluates activities as Go in Good air quality (AQI 45)', () => {
    const verdicts = evaluateActivityVerdicts(45, 'healthy_adult');
    for (const v of verdicts) {
      expect(v.verdict).toBe('Go');
    }
  });

  it('adjusts morning walk to Avoid for vulnerable demographics in Poor conditions (AQI 240)', () => {
    const healthyVerdicts = evaluateActivityVerdicts(240, 'healthy_adult');
    const vulnVerdicts = evaluateActivityVerdicts(240, 'respiratory');

    const healthyWalk = healthyVerdicts.find((v) => v.id === 'morning_walk');
    const vulnWalk = vulnVerdicts.find((v) => v.id === 'morning_walk');

    expect(healthyWalk?.verdict).toBe('Wait');
    expect(vulnWalk?.verdict).toBe('Avoid');
  });

  it('derives safe window recommendation when cleaner forecast hour exists', () => {
    const points: HourlyAirQualityPoint[] = [
      { time: '2026-11-26T08:00', aqi: 350, pm2_5: 220, category: 'Severe', isEstimate: true },
      { time: '2026-11-26T14:00', aqi: 140, pm2_5: 65, category: 'Moderate', isEstimate: true },
    ];
    const verdicts = evaluateActivityVerdicts(350, 'healthy_adult', points);
    const walk = verdicts.find((v) => v.id === 'morning_walk');
    expect(walk?.safeWindow).toContain('14:00');
    expect(walk?.safeWindow).toContain('140');
  });
});
