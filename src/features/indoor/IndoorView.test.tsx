// Unit and accessibility tests for IndoorView, CADR calculator, timer, CR guide, and myths.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import * as aiService from '../../services/ai.js';
import { IndoorView } from './IndoorView.js';
import { clampCadrInputs } from './indoorData.js';

describe('IndoorView & Subcomponents', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('navigates room tabs via keyboard and clamps extreme CADR inputs', async () => {
    const user = userEvent.setup();
    render(<IndoorView aqi={250} cityName="Lucknow" />);

    const livingTab = screen.getByRole('tab', { name: 'Living Room' });
    expect(livingTab).toHaveAttribute('aria-selected', 'true');
    livingTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Bedroom' })).toHaveAttribute('aria-selected', 'true');

    const areaInput = screen.getByLabelText(/Room Area/i);
    fireEvent.change(areaInput, { target: { value: '99999' } });
    expect(clampCadrInputs(-10, 3, 99)).toEqual({ areaSqFt: 10, ceilingHeightFt: 6, targetAch: 12 });
    expect(screen.getByTestId('cadr-cfm')).toHaveTextContent('3750 CFM');
  });

  it('displays Keep Windows Sealed at AQI > 400 and supports timer countdown & AI tips', async () => {
    const { rerender } = render(<IndoorView aqi={425} cityName="Delhi" />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Keep Windows Sealed/i);

    vi.spyOn(aiService, 'getAiResponse').mockResolvedValueOnce({
      task: 'indoor-tips',
      result: { tips: ['Run HEPA at 5 ACH'], urgency: 'high' },
      provenance: { source: 'gemini', model: 'gemini-2.5-flash', cached: false },
    });

    rerender(<IndoorView aqi={250} cityName="Lucknow" />);
    await userEvent.click(screen.getByRole('button', { name: /Get AI Tips/i }));
    await waitFor(() => expect(screen.getByText('Run HEPA at 5 ACH')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /DIY Corsi-Rosenthal/i }));
    expect(screen.getByText(/Assembly Steps:/i)).toBeInTheDocument();

    const sourceLink = screen.getByRole('link', { name: 'Source' });
    expect(sourceLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('counts down ventilation timer to expiration and passes axe audit', async () => {
    vi.useFakeTimers();
    const { container } = render(<IndoorView aqi={250} cityName="Lucknow" />);
    fireEvent.click(screen.getByRole('button', { name: /Start Flush Timer/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15 * 60 * 1000);
    });
    expect(screen.getByText(/Expired — Close Windows/i)).toBeInTheDocument();
    vi.useRealTimers();
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
