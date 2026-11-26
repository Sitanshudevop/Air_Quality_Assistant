// Unit, integration, landmark, and accessibility tests for App component.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { App } from './App.js';
import { DEMO_BANNER_TEXT } from './state/mode.js';
import { resetAiCallStatus } from './services/aiStatus.js';

describe('App Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetAiCallStatus();
    window.localStorage.clear();
    document.documentElement.className = '';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ configured: false }),
    } as Response);
  });

  it('renders title and displays live footer badge when service is configured', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ configured: true }),
    } as Response);

    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Saans (सांस)' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('ai-status')).toHaveTextContent('AI: live');
    });
  });

  it('displays rule-based footer badge when service is not configured or fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('ai-status')).toHaveTextContent('AI: rule-based mode');
    });
  });

  it('displays rule-based footer badge when fetch throws network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline'));

    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('ai-status')).toHaveTextContent('AI: rule-based mode');
    });
  });

  it('renders semantic landmarks, skip link, and persistent demo banner', async () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /Skip to main content/i })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText(DEMO_BANNER_TEXT)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('ai-status')).toHaveTextContent(/AI: (live|rule-based mode)/);
      expect(screen.getByRole('heading', { name: /Next 24-48h Hourly Outlook/i })).toBeInTheDocument();
    });
  });

  it('toggles mode and updates demo banner presence', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText(DEMO_BANNER_TEXT)).toBeInTheDocument();
    const modeBtn = screen.getByRole('button', { name: /Current mode is/i });
    await user.click(modeBtn);

    // After switching to live mode, demo banner disappears
    expect(screen.queryByText(DEMO_BANNER_TEXT)).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('ai-status')).toHaveTextContent(/AI: (live|rule-based mode)/));
  });

  it('toggles dark theme class on document element', async () => {
    const user = userEvent.setup();
    render(<App />);

    const themeBtn = screen.getByRole('button', { name: /Switch to dark theme/i });
    await user.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    const lightBtn = screen.getByRole('button', { name: /Switch to light theme/i });
    await user.click(lightBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('opens and closes Guided Tour and Profile Wizard modals', async () => {
    const user = userEvent.setup();
    render(<App />);

    const tourBtn = screen.getByRole('button', { name: 'Tour' });
    await user.click(tourBtn);
    await waitFor(() => expect(screen.getByRole('dialog', { name: /Dual Operating Modes/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Skip Tour' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const profileBtn = screen.getByRole('button', { name: 'Profile' });
    await user.click(profileBtn);
    await waitFor(() => expect(screen.getByRole('dialog', { name: /Family Smog Profile/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('switches tabs when header navigation links are clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    const routineNav = screen.getByRole('button', { name: 'Daily Routine' });
    await user.click(routineNav);
    expect(routineNav).toHaveAttribute('aria-current', 'page');
  });

  it('passes automated accessibility audits', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ configured: true }),
    } as Response);

    const { container } = render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('ai-status')).toHaveTextContent('AI: live');
      expect(screen.getByRole('heading', { name: /Next 24-48h Hourly Outlook/i })).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
