// Unit tests for WelcomeRibbon callbacks and dismissal persistence.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeRibbon } from './WelcomeRibbon.js';

describe('WelcomeRibbon', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('triggers demo, profile, and tour callbacks and dismisses into sessionStorage', async () => {
    const user = userEvent.setup();
    const onLaunchDemo = vi.fn();
    const onOpenProfile = vi.fn();
    const onStartTour = vi.fn();

    render(<WelcomeRibbon onLaunchDemo={onLaunchDemo} onOpenProfile={onOpenProfile} onStartTour={onStartTour} />);
    await user.click(screen.getByRole('button', { name: '1-Click Demo' }));
    await user.click(screen.getByRole('button', { name: 'Set Up Profile' }));
    await user.click(screen.getByRole('button', { name: 'Guided Tour' }));

    expect(onLaunchDemo).toHaveBeenCalledTimes(1);
    expect(onOpenProfile).toHaveBeenCalledTimes(1);
    expect(onStartTour).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Dismiss welcome banner' }));
    expect(screen.queryByText('New here?')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('saans-ribbon-dismissed')).toBe('1');
  });
});
