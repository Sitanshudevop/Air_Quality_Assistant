// Unit and accessibility tests for App component.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { App } from './App.js';

describe('App Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title and displays Ready when service is configured', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ configured: true }),
    } as Response);

    render(<App />);
    expect(screen.getByText(/Saans \(सांस\)/i)).toBeInTheDocument();

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

  it('passes automated accessibility audits', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ configured: true }),
    } as Response);

    const { container } = render(<App />);
    await waitFor(() => screen.getByTestId('ai-status'));
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
