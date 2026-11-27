// Unit and accessibility tests for ImpactView, ComparisonCard, and impactUtils.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import * as aiService from '../../services/ai.js';
import { ImpactView } from './ImpactView.js';
import { buildImpactFacts, clampDistanceKm, evaluateImpactScenarios } from './impactUtils.js';
import { verifyNumericGrounding } from '../../../server/grounding.js';

describe('ImpactView & ComparisonCard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows 0% delta for identical options and recalculates on mask/distance change', async () => {
    const user = userEvent.setup();
    render(<ImpactView aqi={425} pm25={380} cityName="Delhi" vulnerability="healthy_adult" />);

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getAllByText(/0g vs baseline/i).length).toBeGreaterThanOrEqual(2);

    await user.selectOptions(screen.getByLabelText('Mask Type', { selector: '#opt1-mask' }), 'none');
    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(2);

    expect(clampDistanceKm(-5)).toBe(0);
    expect(clampDistanceKm(999)).toBe(200);
    fireEvent.change(screen.getByLabelText(/Distance \(km\)/i), { target: { value: '20' } });
    expect(screen.getByLabelText(/Distance \(km\)/i)).toHaveValue(20);
  });

  it('opens explainability drawer, calls explain-impact AI, and passes axe audit', async () => {
    vi.spyOn(aiService, 'getAiResponse').mockResolvedValueOnce({
      task: 'explain-impact',
      result: { explanation: 'Metro with N95 cuts exposure sharply.', healthAdvice: 'Keep windows shut.' },
      provenance: { source: 'gemini', model: 'gemini-2.5-flash', cached: false },
    });
    const user = userEvent.setup();
    const { container } = render(<ImpactView aqi={350} pm25={200} cityName="Delhi" />);

    const btns = screen.getAllByRole('button', { name: /Explainability Breakdown/i });
    await user.click(btns[0]);
    expect(screen.getByText(/Not medical advice/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Explain with AI/i }));
    await waitFor(() => {
      expect(screen.getByText('Metro with N95 cuts exposure sharply.')).toBeInTheDocument();
    });
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it('handles transport mode select change, omitted healthAdvice, and chaos pm25/distance values', async () => {
    vi.spyOn(aiService, 'getAiResponse').mockResolvedValueOnce({
      task: 'explain-impact',
      result: { explanation: 'Walk raises inhalation rate.' },
      provenance: { source: 'rules', model: 'rules-v1', cached: false },
    });
    const user = userEvent.setup();
    render(<ImpactView aqi={0} pm25={Number.NaN} cityName="Delhi" />);

    await user.selectOptions(screen.getByLabelText('Transport Mode', { selector: '#opt1-mode' }), 'walk');
    expect(screen.getByText(/Option A: Walking/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Explain with AI/i }));
    await waitFor(() => expect(screen.getByText('Walk raises inhalation rate.')).toBeInTheDocument());

    expect(clampDistanceKm(Number.NaN)).toBe(0);
    expect(clampDistanceKm(Number.POSITIVE_INFINITY)).toBe(0);
    expect(document.body.textContent).not.toContain('NaN');
  });

  it('builds grounding-compatible impact facts with positive % reductions and CO2e savings', () => {
    const results = evaluateImpactScenarios({
      baseline: { id: 'b', label: 'Current', mode: 'two_wheeler_petrol', maskType: 'none' },
      options: [{ id: 'o2', label: 'Option B', mode: 'metro', maskType: 'n95' }],
      distanceKm: 10,
      pm25: 66,
    });
    const facts = buildImpactFacts(results, 66);
    const base = results[0];
    const opt = results[1];
    expect(
      verifyNumericGrounding({
        text: `Metro with N95 reduces dose by ${Math.abs(opt.relativeDoseChangePct)}% (${opt.inhaledDoseUg} ug vs ${base.inhaledDoseUg} ug) and saves ${Math.abs(opt.co2eDeltaGrams)}g CO2e (${opt.co2eGrams}g vs ${base.co2eGrams}g).`,
        facts,
      })
    ).toBe(true);
  });
});
