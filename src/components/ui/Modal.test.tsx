// Accessibility and keyboard focus tests for Modal component.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Modal } from './Modal.js';
import { Button } from './Button.js';

describe('Modal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        Content
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title, description and children when open', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Test Modal"
        description="Helper instructions"
      >
        <p>Modal body content</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Helper instructions')).toBeInTheDocument();
    expect(screen.getByText('Modal body content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        Body
      </Modal>
    );
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key press', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        Body
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('traps focus inside modal between focusable elements on Tab and Shift+Tab', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Focus Trap Modal">
        <Button variant="primary">First Action</Button>
        <Button variant="secondary">Second Action</Button>
      </Modal>
    );

    const closeBtn = screen.getByRole('button', { name: 'Close dialog' });
    const secondBtn = screen.getByRole('button', { name: 'Second Action' });

    // Focus last button and press Tab -> wraps to closeBtn
    secondBtn.focus();
    expect(document.activeElement).toBe(secondBtn);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);

    // Focus close button and press Shift+Tab -> wraps to last button
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(secondBtn);
  });

  it('satisfies automated accessibility audits', async () => {
    const { container } = render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Accessible Dialog"
        description="Clear dialog purpose"
      >
        <Button>Confirm</Button>
      </Modal>
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
