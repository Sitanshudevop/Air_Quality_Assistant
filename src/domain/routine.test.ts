// Unit tests for deterministic daily routine action rules.
import { describe, expect, it } from 'vitest';
import { generateRoutine } from './routine.js';
import type { AqiCategory, RoutinePeriod, UserProfile } from './types.js';

describe('Routine Engine Domain Module', () => {
  const bands: AqiCategory[] = ['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe'];

  it.each(bands)('generates valid 8-period routine items for AQI band %s', (band) => {
    const routine = generateRoutine(band);
    expect(routine).toHaveLength(8);

    const expectedPeriods: RoutinePeriod[] = [
      'wake',
      'commute',
      'work_school',
      'midday',
      'exercise',
      'cooking',
      'evening',
      'sleep',
    ];

    routine.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(expectedPeriods).toContain(item.timeBlock);
      expect(item.action).toBeTruthy();
      expect(item.why).toBeTruthy();
      expect(['low', 'medium', 'high']).toContain(item.effort);
      expect(['free', 'low', 'moderate']).toContain(item.costBand);
      expect(item.impactEstimate).toBeTruthy();
      expect(item.reasonCodes.length).toBeGreaterThan(0);
      expect(item.facts.length).toBeGreaterThan(0);
    });
  });

  describe('User profile adaptation', () => {
    it('adapts commute recommendation for two-wheeler commuters in severe smog', () => {
      const profile: UserProfile = { commuteMode: 'two_wheeler' };
      const routine = generateRoutine('Severe', profile);
      const commuteItem = routine.find((r) => r.timeBlock === 'commute');

      expect(commuteItem?.action).toContain('N95');
      expect(commuteItem?.reasonCodes).toContain('N95_MANDATORY');
      expect(commuteItem?.costBand).toBe('low');
    });

    it('adapts commute recommendation for car commuters', () => {
      const profile: UserProfile = { commuteMode: 'car' };
      const routine = generateRoutine('Severe', profile);
      const commuteItem = routine.find((r) => r.timeBlock === 'commute');

      expect(commuteItem?.action).toContain('recirculation');
      expect(commuteItem?.reasonCodes).toContain('CAR_RECIRCULATION');
      expect(commuteItem?.costBand).toBe('free');
    });

    it('adapts school protocol when children are present in household', () => {
      const childProfile: UserProfile = { vulnerability: 'child' };
      const routine = generateRoutine('Very Poor', childProfile);
      const schoolItem = routine.find((r) => r.timeBlock === 'work_school');

      expect(schoolItem?.action).toContain('Suspend outdoor morning sports');
      expect(schoolItem?.reasonCodes).toContain('CHILD_VULNERABILITY');
    });

    it('includes cooking source control facts depending on fuel type', () => {
      const gasProfile: UserProfile = { cookingFuel: 'lpg' };
      const inductionProfile: UserProfile = { cookingFuel: 'induction' };

      const gasRoutine = generateRoutine('Moderate', gasProfile);
      const inductionRoutine = generateRoutine('Moderate', inductionProfile);

      const gasCooking = gasRoutine.find((r) => r.timeBlock === 'cooking');
      const inductionCooking = inductionRoutine.find((r) => r.timeBlock === 'cooking');

      expect(gasCooking?.facts.some((f) => f.includes('Gas stoves produce NO2'))).toBe(true);
      expect(inductionCooking?.facts.some((f) => f.includes('Induction produces zero combustion'))).toBe(true);
    });

    it('shifts exercise indoors during Poor or worse AQI', () => {
      const severeRoutine = generateRoutine('Severe');
      const goodRoutine = generateRoutine('Good');

      const severeExercise = severeRoutine.find((r) => r.timeBlock === 'exercise');
      const goodExercise = goodRoutine.find((r) => r.timeBlock === 'exercise');

      expect(severeExercise?.action).toContain('indoors');
      expect(goodExercise?.action).toContain('12:30 PM');
    });
  });
});
