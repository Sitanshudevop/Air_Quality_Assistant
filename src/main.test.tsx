// Unit tests for application mount helper.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { mountApp } from './main.js';

describe('Application Bootstrap', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ configured: false }),
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mounts into container without throwing', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root!: ReturnType<typeof mountApp>;
    await act(async () => {
      root = mountApp(container);
    });
    expect(root).toBeDefined();
    await waitFor(() => {
      expect(container.innerHTML).toContain('Saans');
    });
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('handles existing root container on script evaluation', async () => {
    const rootDiv = document.createElement('div');
    rootDiv.id = 'root';
    document.body.appendChild(rootDiv);
    const element = document.getElementById('root');
    expect(element).not.toBeNull();
    if (element) {
      let root!: ReturnType<typeof mountApp>;
      await act(async () => {
        root = mountApp(element);
      });
      act(() => {
        root.unmount();
      });
    }
    document.body.removeChild(rootDiv);
  });
});
