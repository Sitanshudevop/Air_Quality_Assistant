// Accessibility and interactive state tests for ProvenanceBadge component.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ProvenanceBadge } from './ProvenanceBadge.js';

describe('ProvenanceBadge Component', () => {
  it('renders Gemini live mode with model name and no retry button', () => {
    render(
      <ProvenanceBadge
        provenance={{ source: 'gemini', model: 'gemini-2.5-flash', cached: false }}
        onRetry={vi.fn()}
      />
    );
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Gemini live (gemini-2.5-flash)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('renders Rule-based mode with cached indicator and interactive Retry button', () => {
    const onRetry = vi.fn();
    render(
      <ProvenanceBadge
        provenance={{ source: 'rules', model: 'rules-v1', cached: true }}
        onRetry={onRetry}
      />
    );
    expect(screen.getByText('Rule-based mode')).toBeInTheDocument();
    expect(screen.getByText('(cached)')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('disables Retry button and announces loading state when isRetrying is true', () => {
    render(
      <ProvenanceBadge
        provenance={{ source: 'rules', model: 'rules-v1', cached: false }}
        onRetry={vi.fn()}
        isRetrying
      />
    );
    const btn = screen.getByRole('button', { name: 'Retrying...' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('satisfies WCAG 2.2 AA automated accessibility rules in both modes', async () => {
    const { container: c1 } = render(
      <ProvenanceBadge
        provenance={{ source: 'gemini', model: 'gemini-2.5-flash', cached: false }}
      />
    );
    expect((await axe(c1)).violations).toHaveLength(0);

    const { container: c2 } = render(
      <ProvenanceBadge
        provenance={{ source: 'rules', model: 'rules-v1', cached: false }}
        onRetry={vi.fn()}
      />
    );
    expect((await axe(c2)).violations).toHaveLength(0);
  });
});
