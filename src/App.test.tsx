// Unit, integration, landmark, and accessibility tests for App component.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { App } from './App.js';
import { DEMO_BANNER_TEXT } from './state/mode.js';

describe('App Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    document.documentElement.className = '';
  });

  it('renders title and displays Ready when service is configured', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ configured: true }),
    } as Response);

    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Saans (सांस)' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('ai-status')).toHaveTextContent('Ready');
    });
  });

  it('displays Offline when service is not configured or fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('ai-status')).toHaveTextContent('Offline (Rules Active)');
    });
  });

  it('displays Offline when fetch throws network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline'));

    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('ai-status')).toHaveTextContent('Offline (Rules Active)');
    });
  });

  it('renders semantic landmarks, skip link, and persistent demo banner', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /Skip to main content/i })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText(DEMO_BANNER_TEXT)).toBeInTheDocument();
  });

  it('toggles mode and updates demo banner presence', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText(DEMO_BANNER_TEXT)).toBeInTheDocument();
    const modeBtn = screen.getByRole('button', { name: /Current mode is/i });
    await user.click(modeBtn);

    // After switching to live mode, demo banner disappears
    expect(screen.queryByText(DEMO_BANNER_TEXT)).not.toBeInTheDocument();
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

    // Open tour from header
    const tourBtn = screen.getByRole('button', { name: 'Tour' });
    await user.click(tourBtn);
    expect(screen.getByRole('dialog', { name: /Dual Operating Modes/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Skip Tour' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Open profile wizard from header
    const profileBtn = screen.getByRole('button', { name: 'Profile' });
    await user.click(profileBtn);
    expect(screen.getByRole('dialog', { name: /Family Smog Profile/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('passes automated accessibility audits', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ configured: true }),
    } as Response);

    const { container } = render(<App />);
    await waitFor(() => screen.getByTestId('ai-status'));
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('switches across M5 feature tabs, demo cities, and Hindi language toggle', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText(/Demo City/i), 'bengaluru');
    expect(screen.getByRole('heading', { name: 'Bengaluru' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Daily Routine/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Time-Blocked Daily Routine/i })).toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: /Indoor Hacks/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Indoor Air Quality Hacks/i })).toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: /Impact Explainer/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /What If I Choose/i })).toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: /Assistant/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Grounded Air Quality Assistant/i })).toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: /Community Kit/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Community Smog Action Kit/i })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Switch language to Hindi/i }));
    expect(screen.getByRole('heading', { name: /सामुदायिक स्मॉग एक्शन किट/i })).toBeInTheDocument();
  });
});
