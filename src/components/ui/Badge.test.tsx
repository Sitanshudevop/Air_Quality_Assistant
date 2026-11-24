// Accessibility and rendering tests for Badge component.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Badge } from './Badge.js';

describe('Badge Component', () => {
  it('renders AI provenance with model name', () => {
    render(
      <Badge
        provenance={{ source: 'gemini', model: 'gemini-2.5-flash', cached: false }}
      />
    );
    expect(screen.getByText('AI (gemini-2.5-flash)')).toBeInTheDocument();
    expect(screen.queryByText('(cached)')).not.toBeInTheDocument();
  });

  it('renders rule-based badge with cached tag', () => {
    render(
      <Badge
        provenance={{ source: 'rules', model: 'rules-v1', cached: true }}
      />
    );
    expect(screen.getByText('Rule-based')).toBeInTheDocument();
    expect(screen.getByText('(cached)')).toBeInTheDocument();
  });

  it('satisfies WCAG accessibility rules', async () => {
    const { container } = render(
      <Badge
        provenance={{ source: 'gemini', model: 'gemini-2.5-flash', cached: false }}
      />
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
