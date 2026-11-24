// Accessibility and interaction tests for Button component.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Button } from './Button.js';

describe('Button Component', () => {
  it('renders children and handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeInTheDocument();
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state and prevents clicks', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={handleClick}>
        Disabled Action
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Disabled Action' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('supports aria attributes for toggle states', () => {
    render(
      <Button aria-pressed="true" variant="outline" size="sm">
        Toggle View
      </Button>
    );
    const button = screen.getByRole('button', { name: 'Toggle View' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('satisfies automated accessibility audits across variants', async () => {
    const { container } = render(
      <div>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
