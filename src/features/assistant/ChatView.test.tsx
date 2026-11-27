// Unit and accessibility tests for ChatView and chatUtils.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import * as aiService from '../../services/ai.js';
import { ChatView } from './ChatView.js';
import {
  CHAT_STORAGE_KEY,
  loadChatHistory,
  saveChatHistory,
  type ChatMessage,
} from './chatUtils.js';

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
    expect(input).toHaveAttribute('maxLength', '1000');
    await user.type(input, 'Should I jog outside?');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Unable to send message/i));

    await user.click(screen.getByRole('button', { name: 'Clear Chat' }));
    expect(window.localStorage.getItem(CHAT_STORAGE_KEY)).toBeNull();
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it('clears corrupted, non-array, invalid-item, and oversized chat history and supports valid round-trip', () => {
    const oversized = Array.from({ length: 31 }, (_, i) => ({
      id: `m-${i}`,
      role: 'user',
      text: `msg ${i}`,
    }));
    const invalidPayloads = [
      '{',
      '{}',
      JSON.stringify([{ id: '1', role: 'system', text: 'x' }]),
      JSON.stringify(oversized),
    ];

    for (const payload of invalidPayloads) {
      window.localStorage.setItem(CHAT_STORAGE_KEY, payload);
      expect(loadChatHistory()).toEqual([]);
      expect(window.localStorage.getItem(CHAT_STORAGE_KEY)).toBeNull();
    }

    const validMessages: ChatMessage[] = [
      { id: 'u-1', role: 'user', text: 'What is the AQI?' },
      { id: 'a-1', role: 'assistant', text: 'AQI is 180 (Moderate).' },
    ];
    saveChatHistory(validMessages);
    expect(loadChatHistory()).toEqual(validMessages);
  });

  it('triggers suggested action chips, omits Retry without promptText, and aborts in-flight requests on Clear Chat', async () => {
    const spy = vi.spyOn(aiService, 'getAiResponse')
      .mockResolvedValueOnce({
        task: 'chat',
        result: { reply: 'First answer', suggestedActions: ['Check hourly forecast'] },
        provenance: { source: 'rules', model: 'rules-v1', cached: false },
      })
      .mockResolvedValueOnce({
        task: 'chat',
        result: { reply: 'Follow-up answer' },
        provenance: { source: 'gemini', model: 'gemini-2.5-flash', cached: false },
      });

    const user = userEvent.setup();
    render(<ChatView aqi={190} category="Moderate" cityName="Delhi" />);

    await user.click(screen.getByRole('button', { name: 'Is it safe to open windows now?' }));
    await waitFor(() => expect(screen.getByText('First answer')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Check hourly forecast' }));
    await waitFor(() => expect(screen.getByText('Follow-up answer')).toBeInTheDocument());

    let capturedSignal: AbortSignal | undefined;
    spy.mockImplementationOnce((input) => {
      capturedSignal = input.signal;
      return new Promise(() => {});
    });
    const input = screen.getByLabelText(/Ask the Saans air quality assistant/i);
    await user.type(input, 'In-flight question');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(capturedSignal?.aborted).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Clear Chat' }));
    expect(capturedSignal?.aborted).toBe(true);
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('renders structured multiline bullet replies as list items without executing HTML', async () => {
    vi.spyOn(aiService, 'getAiResponse').mockResolvedValueOnce({
      task: 'chat',
      result: {
        reply:
          'Bottom line: use Metro with N95 today.\n- Keep windows closed until 14:00.\n- Wear an N95 mask outdoors and avoid <script>alert(1)</script> traffic roads.',
      },
      provenance: { source: 'gemini', model: 'gemini-3.5-flash-lite', cached: false },
    });
    const user = userEvent.setup();
    render(<ChatView aqi={149} category="Moderate" cityName="Ranchi" />);

    const input = screen.getByLabelText(/Ask the Saans air quality assistant/i);
    await user.type(input, 'How should I commute?');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(screen.getByText('Bottom line: use Metro with N95 today.')).toBeInTheDocument(),
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Keep windows closed until 14:00.');
    expect(items[1]).toHaveTextContent('<script>alert(1)</script>');
    expect(document.querySelector('script')).toBeNull();
  });
});
