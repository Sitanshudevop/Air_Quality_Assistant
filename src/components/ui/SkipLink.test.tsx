// Accessibility and behavior tests for SkipLink component.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { SkipLink } from './SkipLink.js';

describe('SkipLink Component', () => {
  it('renders default link pointing to #main-content', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('renders custom label and target anchor', () => {
    render(<SkipLink targetId="#custom-target" label="Jump to results" />);
    const link = screen.getByRole('link', { name: 'Jump to results' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#custom-target');
  });

  it('satisfies automated accessibility audits', async () => {
    const { container } = render(<SkipLink />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
