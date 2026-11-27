// Unit and accessibility tests for CommunityKitView, CommunityNoticeCard, and communityData.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import * as aiService from '../../services/ai.js';
import { CommunityKitView } from './CommunityKitView.js';
import { formatWhatsAppNotice, sanitizeNoticeField, validateEmergencyPhone } from './communityData.js';

describe('CommunityKitView & Notice Sanitization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('updates actions on AQI band transition, sanitizes XSS, and validates phone', async () => {
    expect(sanitizeNoticeField('<script>alert(1)</script>RWA <b>Main</b>')).toBe('RWA Main');
    expect(validateEmergencyPhone('abc-invalid!')).toBe(false);
    expect(validateEmergencyPhone('+91 11223344')).toBe(true);
    expect(formatWhatsAppNotice('x'.repeat(1200)).length).toBe(1000);

    const { rerender } = render(<CommunityKitView aqi={45} category="Good" cityName="Bengaluru" />);
    expect(screen.getByText(/Checklist for Good Band/i)).toBeInTheDocument();

    rerender(<CommunityKitView aqi={425} category="Severe" cityName="Delhi" />);
    expect(screen.getByText(/Checklist for Severe Band/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Issue immediate emergency circular/i).length).toBeGreaterThanOrEqual(1);

    const user = userEvent.setup();
    const societyInput = screen.getByLabelText(/Society \/ School Name/i);
    expect(societyInput).toHaveAttribute('maxLength', '100');
    const phoneInput = screen.getByLabelText(/Emergency Contact Phone/i);
    expect(phoneInput).toHaveAttribute('maxLength', '20');
    await user.clear(phoneInput);
    await user.type(phoneInput, 'invalid!!');
    expect(screen.getByRole('alert')).toHaveTextContent(/valid 6–20 digit/i);
  });

  it('copies notice to clipboard, handles clipboard rejection fallback, drafts AI notice, and passes axe', async () => {
    vi.spyOn(aiService, 'getAiResponse').mockResolvedValueOnce({
      task: 'community-message',
      result: { message: 'School outdoor assembly suspended today.', urgency: 'high' },
      provenance: { source: 'gemini', model: 'gemini-2.5-flash', cached: false },
    });

    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { container } = render(<CommunityKitView aqi={425} category="Severe" cityName="Delhi" />);

    await user.click(screen.getByRole('button', { name: /Draft with AI/i }));
    await waitFor(() => expect(screen.getByText(/School outdoor assembly suspended/i)).toBeInTheDocument());

    const copyBtn = screen.getByRole('button', { name: /Copy Notice to Clipboard/i });
    await user.click(copyBtn);
    await waitFor(() => expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument());

    await user.click(copyBtn);
    await waitFor(() => expect(screen.getByText(/Clipboard blocked/i)).toBeInTheDocument());
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it('pre-populates society name from deep-link template and copies shareable deep link', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(
      <CommunityKitView
        aqi={380}
        category="Very Poor"
        cityName="Delhi"
        template="school"
        persona="school_rwa"
      />
    );

    expect(screen.getByLabelText(/Society \/ School Name/i)).toHaveValue('Delhi Public School');
    await user.click(screen.getByRole('button', { name: /Copy Link/i }));
    await waitFor(() => expect(screen.getByText(/Deep link copied to clipboard!/i)).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('tab=community&persona=school_rwa&template=school'));
  });
});
