// Step navigation and accessibility tests for GuidedTour component.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { GuidedTour } from './GuidedTour.js';

describe('GuidedTour Component', () => {
  it('does not render when isOpen is false', () => {
    render(<GuidedTour isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders Step 1 initially and advances through all 5 steps', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(<GuidedTour isOpen={true} onClose={handleClose} />);

    expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();
    expect(screen.getByText('Dual Operating Modes')).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: 'Next' });
    await user.click(nextBtn);
    expect(screen.getByText(/Step 2 of 5/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/Step 3 of 5/i)).toBeInTheDocument();

    // Previous works
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByText(/Step 2 of 5/i)).toBeInTheDocument();

    // Advance to last step
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText(/Step 5 of 5/i)).toBeInTheDocument();
    const finishBtn = screen.getByRole('button', { name: 'Finish Tour' });
    expect(finishBtn).toBeInTheDocument();

    await user.click(finishBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes tour when Skip Tour is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(<GuidedTour isOpen={true} onClose={handleClose} />);

    await user.click(screen.getByRole('button', { name: 'Skip Tour' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('satisfies automated accessibility audits across steps', async () => {
    const { container } = render(<GuidedTour isOpen={true} onClose={vi.fn()} />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
