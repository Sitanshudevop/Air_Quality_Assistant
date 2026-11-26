// Unit and accessibility tests for PrintPlan and PrintButton components.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { generateRoutine } from '../../domain/routine.js';
import { PrintPlan } from './PrintPlan.js';

describe('PrintPlan & PrintButton Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders emergency contacts, human-readable routine labels, citations, and triggers print', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const user = userEvent.setup();
    const routineItems = generateRoutine('Severe');

    render(
      <PrintPlan cityName="Delhi" aqi={425} category="Severe" routineItems={routineItems} />
    );

    expect(screen.getByText(/National Emergency 112/i)).toBeInTheDocument();
    expect(screen.getByText('Wake-up:')).toBeInTheDocument();
    expect(screen.getByText('Commute:')).toBeInTheDocument();
    expect(screen.queryByText('WAKE:')).not.toBeInTheDocument();
    expect(screen.queryByText('COMMUTE:')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /CPCB India NAAQS/i })).toHaveAttribute('rel', 'noopener noreferrer');

    await user.click(screen.getByRole('button', { name: /Print Family Smog Plan/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('renders null when aqi or category is missing', () => {
    const { container } = render(
      <PrintPlan cityName="Delhi" aqi={undefined} category={undefined} routineItems={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('passes automated accessibility audit', async () => {
    const { container } = render(
      <PrintPlan cityName="Delhi" aqi={425} category="Severe" routineItems={[]} />
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
