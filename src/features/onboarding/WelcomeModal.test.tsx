// Unit and accessibility tests for WelcomeModal and tour-steps compatibility helpers.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { WelcomeModal } from './WelcomeModal.js';
import {
  getNextStep,
  isTourCompleted,
  resetTourCompleted,
  skipTour,
  TOUR_STEPS,
} from './tour-steps.js';

describe('WelcomeModal & tour-steps helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetTourCompleted();
  });

  it('navigates tour steps and persists skip/completion state', () => {
    expect(TOUR_STEPS.length).toBeGreaterThanOrEqual(5);
    expect(getNextStep(1)).toBe(2);
    expect(getNextStep(99)).toBe(TOUR_STEPS.length);
    expect(isTourCompleted()).toBe(false);
    skipTour();
    expect(isTourCompleted()).toBe(true);
  });

  it('renders WelcomeModal dialog, invokes action callbacks, and passes axe audit', async () => {
    const onLaunchDemo = vi.fn();
    const onOpenProfile = vi.fn();
    const onStartTour = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    const { container } = render(
      <WelcomeModal
        isOpen={true}
        onClose={onClose}
        onLaunchDemo={onLaunchDemo}
        onOpenProfile={onOpenProfile}
        onStartTour={onStartTour}
      />
    );

    expect(screen.getByRole('dialog', { name: /Welcome to Saans/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /1-Click Demo Launch/i }));
    expect(onLaunchDemo).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Set Up Family Profile/i }));
    expect(onOpenProfile).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Guided Tour/i }));
    expect(onStartTour).toHaveBeenCalledTimes(1);

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
