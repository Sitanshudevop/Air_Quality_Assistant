// Validation, persistence, and accessibility tests for ProfileWizard.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ProfileWizard } from './ProfileWizard.js';
import { clearProfile } from '../../services/profile.js';

describe('ProfileWizard Component', () => {
  beforeEach(() => {
    clearProfile();
  });

  it('does not render when isOpen is false', () => {
    render(<ProfileWizard isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders form inputs and saves updated profile', async () => {
    const handleUpdated = vi.fn();
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ProfileWizard
        isOpen={true}
        onClose={handleClose}
        onProfileUpdated={handleUpdated}
      />
    );

    expect(screen.getByLabelText(/City Name/i)).toBeInTheDocument();
    const cityInput = screen.getByLabelText(/City Name/i);
    await user.clear(cityInput);
    await user.type(cityInput, 'Lucknow');

    const purifierCheckbox = screen.getByLabelText(/Owns Air Purifier/i);
    await user.click(purifierCheckbox);

    await user.click(screen.getByRole('button', { name: 'Save Profile' }));
    expect(handleUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ cityName: 'Lucknow', hasPurifier: true })
    );
  });

  it('handles "Clear my data" flow with confirmation dialog', async () => {
    const handleUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <ProfileWizard
        isOpen={true}
        onClose={vi.fn()}
        onProfileUpdated={handleUpdated}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Clear my data' }));
    expect(screen.getByText('Clear all stored data?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Yes, Clear My Data' }));
    expect(handleUpdated).toHaveBeenCalled();
    expect(screen.getByText(/Data cleared/i)).toBeInTheDocument();
  });

  it('satisfies automated accessibility audits', async () => {
    const { container } = render(
      <ProfileWizard isOpen={true} onClose={vi.fn()} />
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
