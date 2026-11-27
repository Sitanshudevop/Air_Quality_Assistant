// Unit tests for PersonalizePlanCard segmented controls and profile persistence.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PersonalizePlanCard } from './PersonalizePlanCard.js';

describe('PersonalizePlanCard', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('switches across household, travel, and home segments and saves updated profile', async () => {
    const onProfileUpdated = vi.fn();
    const user = userEvent.setup();
    render(<PersonalizePlanCard onProfileUpdated={onProfileUpdated} />);

    // Household segment
    await user.selectOptions(screen.getByLabelText(/Highest Vulnerability in Household/i), 'elderly');

    // Travel segment
    await user.click(screen.getByRole('radio', { name: 'travel' }));
    await user.selectOptions(screen.getByLabelText(/Primary Daily Commute Mode/i), 'metro');

    // Home segment
    await user.click(screen.getByRole('radio', { name: 'home' }));
    await user.selectOptions(screen.getByLabelText(/Cooking Fuel/i), 'induction');
    await user.click(screen.getByRole('checkbox'));

    // Save
    await user.click(screen.getByRole('button', { name: /Update my plan/i }));
    expect(onProfileUpdated).toHaveBeenCalledTimes(1);
    expect(onProfileUpdated.mock.calls[0][0]).toMatchObject({
      vulnerabilities: ['elderly'],
      commuteMode: 'metro',
      cookingFuel: 'induction',
    });
  });
});
