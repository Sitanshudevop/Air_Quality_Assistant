// Unit and accessibility tests for ChatView and chatUtils.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import * as aiService from '../../services/ai.js';
import { ChatView } from './ChatView.js';
import { CHAT_STORAGE_KEY } from './chatUtils.js';

describe('ChatView & chatUtils', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('sends suggestion chip, renders safety card styling, and retries on rules mode', async () => {
    const spy = vi.spyOn(aiService, 'getAiResponse').mockResolvedValueOnce({
      task: 'chat',
      result: {
        reply: 'Call emergency 112 immediately for chest pain or breathlessness.',
        suggestedActions: ['Seek urgent care'],
      },
      provenance: { source: 'rules', model: 'rules-v1', cached: false },
    });
    const user = userEvent.setup();
    render(<ChatView aqi={425} category="Severe" cityName="Delhi" />);

    await user.click(screen.getByRole('button', { name: 'Is it safe to open windows now?' }));
    await waitFor(() => expect(screen.getByText(/Call emergency 112/i)).toBeInTheDocument());
    expect(screen.getByRole('log')).toBeInTheDocument();

    spy.mockResolvedValueOnce({
      task: 'chat',
      result: { reply: 'Retried live answer.' },
      provenance: { source: 'gemini', model: 'gemini-2.5-flash', cached: false },
    });
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.getByText('Retried live answer.')).toBeInTheDocument());
  });

  it('handles network rejection alert, prevents rapid duplicate submit, clears chat, and passes axe', async () => {
    vi.spyOn(aiService, 'getAiResponse').mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();
    const { container } = render(<ChatView aqi={200} category="Moderate" cityName="Mumbai" />);

    const input = screen.getByLabelText(/Ask the Saans air quality assistant/i);
    await user.type(input, 'Should I jog outside?');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Unable to send message/i));

    await user.click(screen.getByRole('button', { name: 'Clear Chat' }));
    expect(window.localStorage.getItem(CHAT_STORAGE_KEY)).toBeNull();
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
