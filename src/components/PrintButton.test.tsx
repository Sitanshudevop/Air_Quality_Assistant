// Unit and accessibility tests for PrintButton component.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { PrintButton } from './PrintButton.js';

describe('PrintButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders default label, invokes window.print on click, and passes axe audit', async () => {
    const printMock = vi.fn();
    Object.defineProperty(window, 'print', { value: printMock, configurable: true, writable: true });
    const user = userEvent.setup();

    const { container } = render(<PrintButton className="custom-print" />);
    const btn = screen.getByRole('button', { name: 'Print Family Smog Plan' });
    expect(btn).toHaveTextContent('Print Plan');
    expect(btn.className).toContain('custom-print');

    await user.click(btn);
    expect(printMock).toHaveBeenCalledTimes(1);
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it('supports custom label and degrades safely when window.print is unavailable', async () => {
    Object.defineProperty(window, 'print', { value: undefined, configurable: true, writable: true });
    const user = userEvent.setup();

    render(<PrintButton label="Print Summary" />);
    const btn = screen.getByRole('button', { name: 'Print Family Smog Plan' });
    expect(btn).toHaveTextContent('Print Summary');
    await user.click(btn);
  });
});
