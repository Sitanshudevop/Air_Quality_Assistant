// Unit tests for ProfileFormFields input controls and change events.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ProfileFormFields } from './ProfileFormFields.js';
import { DEFAULT_PROFILE } from '../../services/profile.types.js';

describe('ProfileFormFields Component', () => {
  it('triggers onChange for all input fields', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ProfileFormFields
        formData={DEFAULT_PROFILE}
        onChange={handleChange}
      />
    );

    // City Name
    const cityInput = screen.getByLabelText(/City Name/i);
    expect(cityInput).toHaveAttribute('maxLength', '100');
    await user.clear(cityInput);
    await user.type(cityInput, 'Kanpur');
    expect(handleChange).toHaveBeenCalledWith('cityName', expect.any(String));

    // Vulnerability
    const vulnSelect = screen.getByLabelText(/Vulnerability/i);
    await user.selectOptions(vulnSelect, 'elderly');
    expect(handleChange).toHaveBeenCalledWith('vulnerability', 'elderly');

    // Commute Mode
    const commuteSelect = screen.getByLabelText(/Commute Mode/i);
    await user.selectOptions(commuteSelect, 'bus');
    expect(handleChange).toHaveBeenCalledWith('commuteMode', 'bus');

    // Commute Distance
    const distanceInput = screen.getByLabelText(/Commute Distance/i);
    fireEvent.change(distanceInput, { target: { value: '15' } });
    expect(handleChange).toHaveBeenCalledWith('commuteDistanceKm', 15);

    // Household Members
    const membersInput = screen.getByLabelText(/Household Members/i);
    fireEvent.change(membersInput, { target: { value: '4' } });
    expect(handleChange).toHaveBeenCalledWith('householdMembers', 4);

    // Owns Purifier
    const purifierCheckbox = screen.getByLabelText(/Owns Air Purifier/i);
    await user.click(purifierCheckbox);
    expect(handleChange).toHaveBeenCalledWith('hasPurifier', true);
  });

  it('satisfies automated accessibility audits', async () => {
    const { container } = render(
      <ProfileFormFields
        formData={DEFAULT_PROFILE}
        onChange={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
