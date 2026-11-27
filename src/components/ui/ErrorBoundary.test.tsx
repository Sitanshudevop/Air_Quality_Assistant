// Unit tests for ErrorBoundary fallback UI and recovery behavior.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ErrorBoundary } from './ErrorBoundary.js';

function BrokenChild({ shouldThrow }: { shouldThrow: boolean }): ReactElement {
  if (shouldThrow) {
    throw new Error('Sensitive internal stack detail: SECRET_XYZ');
  }
  return <p>Healthy Saans Dashboard</p>;
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children normally when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <BrokenChild shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Healthy Saans Dashboard')).toBeInTheDocument();
  });

  it('renders Bento alert fallback without leaking error details and invokes recovery', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onReset = vi.fn();

    render(
      <ErrorBoundary onReset={onReset}>
        <BrokenChild shouldThrow />
      </ErrorBoundary>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(alert.textContent).not.toContain('SECRET_XYZ');

    fireEvent.click(screen.getByRole('button', { name: /Reload Saans/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('falls back to window.location.reload when onReset is not provided', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadSpy },
      configurable: true,
    });

    render(
      <ErrorBoundary>
        <BrokenChild shouldThrow />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /Reload Saans/i }));
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
