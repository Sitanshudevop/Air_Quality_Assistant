// Accessibility and click interaction tests for WelcomeCard component.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { WelcomeCard } from './WelcomeCard.js';

describe('WelcomeCard Component', () => {
  it('renders welcome heading and 3 action triggers', () => {
    render(
      <WelcomeCard
        onLaunchDemo={vi.fn()}
        onOpenProfile={vi.fn()}
        onStartTour={vi.fn()}
      />
    );
    expect(screen.getByRole('heading', { name: /Welcome to Saans/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1-Click Demo Launch/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Set Up Family Profile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guided Tour/i })).toBeInTheDocument();
  });

  it('triggers respective callbacks when buttons are clicked', async () => {
    const launchDemo = vi.fn();
    const openProfile = vi.fn();
    const startTour = vi.fn();
    const user = userEvent.setup();

    render(
      <WelcomeCard
        onLaunchDemo={launchDemo}
        onOpenProfile={openProfile}
        onStartTour={startTour}
      />
    );

    await user.click(screen.getByRole('button', { name: /1-Click Demo Launch/i }));
    expect(launchDemo).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Set Up Family Profile/i }));
    expect(openProfile).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Guided Tour/i }));
    expect(startTour).toHaveBeenCalledTimes(1);
  });

  it('satisfies automated accessibility audits', async () => {
    const { container } = render(
      <WelcomeCard
        onLaunchDemo={vi.fn()}
        onOpenProfile={vi.fn()}
        onStartTour={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
