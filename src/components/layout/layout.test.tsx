// Component unit and accessibility tests for layout elements.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { AppHeader } from './AppHeader.js';
import { AppFooter } from './AppFooter.js';
import { DemoBanner } from './DemoBanner.js';
import { DEMO_BANNER_TEXT } from '../../state/mode.js';

describe('Layout Components', () => {
  describe('DemoBanner', () => {
    it('renders banner text when isDemo is true', () => {
      render(<DemoBanner isDemo={true} />);
      expect(screen.getByRole('status')).toHaveTextContent(DEMO_BANNER_TEXT);
    });

    it('renders null when isDemo is false', () => {
      const { container } = render(<DemoBanner isDemo={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('AppHeader', () => {
    it('renders title and handles toggle actions', async () => {
      const toggleMode = vi.fn();
      const toggleTheme = vi.fn();
      const openTour = vi.fn();
      const openProfile = vi.fn();
      const user = userEvent.setup();

      render(
        <AppHeader
          mode="demo"
          onToggleMode={toggleMode}
          isDark={false}
          onToggleTheme={toggleTheme}
          onOpenTour={openTour}
          onOpenProfile={openProfile}
        />
      );

      await user.click(screen.getByRole('button', { name: /Current mode is demo/i }));
      expect(toggleMode).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('button', { name: /Switch to dark theme/i }));
      expect(toggleTheme).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('button', { name: 'Tour' }));
      expect(openTour).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('button', { name: 'Profile' }));
      expect(openProfile).toHaveBeenCalledTimes(1);
    });

    it('satisfies automated accessibility audits', async () => {
      const { container } = render(
        <AppHeader
          mode="live"
          onToggleMode={vi.fn()}
          isDark={true}
          onToggleTheme={vi.fn()}
          onOpenTour={vi.fn()}
          onOpenProfile={vi.fn()}
        />
      );
      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('AppFooter', () => {
    it('renders citations and health disclaimer', () => {
      render(<AppFooter />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      expect(screen.getByText(/Disclaimer:/i)).toBeInTheDocument();
    });

    it('satisfies automated accessibility audits', async () => {
      const { container } = render(<AppFooter />);
      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });
  });
});
