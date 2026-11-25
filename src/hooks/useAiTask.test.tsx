// Unit tests for useAiTask hook covering trigger, retry, error handling, and autoFetch.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAiTask } from './useAiTask.js';
import * as aiService from '../services/ai.js';

describe('useAiTask Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in rules provenance and updates data on trigger and retry', async () => {
    const spy = vi.spyOn(aiService, 'getAiResponse').mockResolvedValueOnce({
      task: 'narrate-plan',
      result: { narrative: 'Stay indoors today.', recommendations: ['Use HEPA'] },
      provenance: { source: 'gemini', model: 'gemini-2.5-flash', cached: false },
    });

    const { result } = renderHook(() =>
      useAiTask<{ narrative: string; recommendations: string[] }>({
        task: 'narrate-plan',
        context: { aqi: 300, city: 'Delhi', facts: ['AQI 300'] },
      })
    );

    expect(result.current.data).toBeNull();
    expect(result.current.provenance.source).toBe('rules');

    await act(async () => {
      await result.current.trigger();
    });

    expect(result.current.data?.narrative).toBe('Stay indoors today.');
    expect(result.current.provenance.source).toBe('gemini');

    spy.mockResolvedValueOnce({
      task: 'narrate-plan',
      result: { narrative: 'Retried plan', recommendations: [] },
      provenance: { source: 'rules', model: 'rules-v1', cached: false },
    });

    await act(async () => {
      await result.current.retry();
    });

    expect(result.current.data?.narrative).toBe('Retried plan');
  });

  it('handles autoFetch and error state cleanly', async () => {
    vi.spyOn(aiService, 'getAiResponse').mockRejectedValueOnce(new Error('Proxy down'));

    const { result } = renderHook(() =>
      useAiTask({
        task: 'indoor-tips',
        context: { aqi: 250, city: 'Lucknow', facts: [] },
        autoFetch: true,
      })
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Proxy down');
    });
    expect(result.current.isLoading).toBe(false);
  });
});
