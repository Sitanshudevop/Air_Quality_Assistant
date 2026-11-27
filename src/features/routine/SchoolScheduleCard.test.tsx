// Unit tests for SchoolScheduleCard toggle and AQI precaution rendering.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchoolScheduleCard } from './SchoolScheduleCard.js';

describe('SchoolScheduleCard', () => {
  it('renders collapsed switch when disabled and calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<SchoolScheduleCard aqi={250} isEnabled={false} onToggle={onToggle} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Off')).toBeInTheDocument();

    await user.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders precautions across Severe, Poor, and Good AQI levels when enabled', () => {
    const { rerender } = render(<SchoolScheduleCard aqi={420} isEnabled={true} onToggle={() => {}} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getAllByText('Suspended').length).toBeGreaterThan(0);

    rerender(<SchoolScheduleCard aqi={250} isEnabled={true} onToggle={() => {}} />);
    expect(screen.getAllByText('Modified').length).toBeGreaterThan(0);

    rerender(<SchoolScheduleCard aqi={50} isEnabled={true} onToggle={() => {}} />);
    expect(screen.getAllByText('Permitted').length).toBeGreaterThan(0);
  });
});
