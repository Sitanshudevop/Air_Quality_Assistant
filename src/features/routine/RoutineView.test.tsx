// Unit and accessibility tests for RoutineView, RoutineItemCard, and routineUtils.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import * as aiService from '../../services/ai.js';
import { RoutineView } from './RoutineView.js';
import { mapStoredProfileToDomain } from './routineUtils.js';

describe('RoutineView & RoutineUtils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes two-wheeler hyphenated commuteMode and renders all 8 time blocks', () => {
    const mapped = mapStoredProfileToDomain({ commuteMode: 'two-wheeler', vulnerabilities: ['asthmatic'] });
    expect(mapped.commuteMode).toBe('two_wheeler');
    expect(mapped.vulnerability).toBe('respiratory');

    render(<RoutineView aqi={425} category="Severe" cityName="Delhi" profile={{ commuteMode: 'two-wheeler' }} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Severe Smog Emergency/i);
    expect(screen.getAllByRole('button', { name: /Why & Facts/i })).toHaveLength(8);
    expect(screen.getAllByText(/Outdoor Locked \(Severe\)/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Wear a certified N95 respirator/i).length).toBeGreaterThanOrEqual(1);
  });

  it('expands Why & Facts drawer via click and fetches AI narrate-plan summary', async () => {
    vi.spyOn(aiService, 'getAiResponse').mockResolvedValueOnce({
      task: 'narrate-plan',
      result: { narrative: 'Custom Gemini narrative for Delhi.', recommendations: ['Seal bedroom'] },
      provenance: { source: 'gemini', model: 'gemini-2.5-flash', cached: false },
    });
    const user = userEvent.setup();
    render(<RoutineView aqi={260} category="Poor" cityName="Lucknow" />);

    const drawerBtns = screen.getAllByRole('button', { name: /Why & Facts/i });
    expect(drawerBtns[0]).toHaveAttribute('aria-expanded', 'false');
    await user.click(drawerBtns[0]);
    expect(drawerBtns[0]).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Rationale:/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /AI Narrate Plan/i }));
    await waitFor(() => {
      expect(screen.getByText('Custom Gemini narrative for Delhi.')).toBeInTheDocument();
    });
    expect(screen.getByText(/Gemini live/i)).toBeInTheDocument();
  });

  it('passes household userPreferences to narrate-plan AI task context', async () => {
    const spy = vi.spyOn(aiService, 'getAiResponse').mockResolvedValueOnce({
      task: 'narrate-plan',
      result: { narrative: 'Plan for child.', recommendations: ['Stay inside'] },
      provenance: { source: 'gemini', model: 'gemini-3.5-flash-lite', cached: false },
    });
    render(
      <RoutineView
        aqi={310}
        category="Very Poor"
        cityName="Delhi"
        profile={{ vulnerabilities: ['child'], commuteMode: 'metro', hasPurifier: true, cookingFuel: 'induction' }}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /AI Narrate Plan/i }));
    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(spy.mock.calls[0]?.[0]?.context?.userPreferences).toEqual({
      vulnerability: 'child',
      commuteMode: 'metro',
      hasPurifier: true,
      cookingFuel: 'induction',
    });
  });

  it('handles empty routine override gracefully and passes axe audit', async () => {
    const { container } = render(
      <RoutineView aqi={45} category="Good" cityName="Bengaluru" itemsOverride={[]} />
    );
    expect(screen.getByText(/No routine actions available/i)).toBeInTheDocument();
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it('maps empty {} and undefined profiles safely to defaults', () => {
    expect(mapStoredProfileToDomain({})).toEqual({
      vulnerability: 'healthy_adult',
      commuteMode: undefined,
      hasPurifier: false,
      cookingFuel: 'lpg',
    });
    expect(mapStoredProfileToDomain(undefined).vulnerability).toBe('healthy_adult');
  });
});
