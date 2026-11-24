// Unit tests for application mount helper.
import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { mountApp } from './main.js';

describe('Application Bootstrap', () => {
  it('mounts into container without throwing', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = mountApp(container);
    expect(root).toBeDefined();
    await waitFor(() => {
      expect(container.innerHTML).toContain('Saans');
    });
    root.unmount();
    document.body.removeChild(container);
  });

  it('handles existing root container on script evaluation', () => {
    const rootDiv = document.createElement('div');
    rootDiv.id = 'root';
    document.body.appendChild(rootDiv);
    const element = document.getElementById('root');
    expect(element).not.toBeNull();
    if (element) {
      const root = mountApp(element);
      root.unmount();
    }
    document.body.removeChild(rootDiv);
  });
});
