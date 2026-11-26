// Unit and interaction tests for MorningBriefingCard component.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { MorningBriefingCard } from './MorningBriefingCard.js';

describe('MorningBriefingCard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders morning briefing for Severe conditions and copies share text', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<MorningBriefingCard cityName="Delhi" aqi={410} category="Severe" />);

    expect(screen.getByText('Morning Briefing: Delhi')).toBeInTheDocument();
    expect(screen.getByText(/Commute Transit/i)).toBeInTheDocument();
    expect(screen.getByText(/School Morning/i)).toBeInTheDocument();
    expect(screen.getByText(/Evening Inversion/i)).toBeInTheDocument();
    expect(screen.getByText(/Priority Action Checklist/i)).toBeInTheDocument();

    const copyBtn = screen.getByRole('button', { name: /Copy Briefing/i });
    await user.click(copyBtn);
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Briefing copied!')).toBeInTheDocument();
  });

  it('triggers Web Share API when supported', async () => {
    const user = userEvent.setup();
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
      writable: true,
    });

    render(<MorningBriefingCard cityName="Lucknow" aqi={280} category="Poor" />);
    const shareBtn = screen.getByRole('button', { name: /Share/i });
    await user.click(shareBtn);
    expect(shareMock).toHaveBeenCalledTimes(1);
  });

  it('returns null when aqi is undefined', () => {
    const { container } = render(<MorningBriefingCard cityName="Noida" aqi={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('satisfies automated accessibility audit', async () => {
    const { container } = render(<MorningBriefingCard cityName="Kanpur" aqi={320} category="Severe" />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
