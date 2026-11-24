// Unit tests for React ModeContext provider and useMode consumer hook.
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ModeProvider, useMode } from './ModeContext.js';

/** Test consumer component exercising useMode hook. */
function ModeConsumer(): React.ReactElement {
  const { mode, toggleMode, setMode, isDemo, isLive } = useMode();
  return (
    <div>
      <span data-testid="mode-value">{mode}</span>
      <span data-testid="is-demo">{String(isDemo)}</span>
      <span data-testid="is-live">{String(isLive)}</span>
      <button onClick={toggleMode}>Toggle</button>
      <button onClick={(): void => setMode('live')}>Set Live</button>
    </div>
  );
}

describe('ModeContext and useMode', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('provides default demo mode to child components', () => {
    render(
      <ModeProvider>
        <ModeConsumer />
      </ModeProvider>
    );

    expect(screen.getByTestId('mode-value').textContent).toBe('demo');
    expect(screen.getByTestId('is-demo').textContent).toBe('true');
    expect(screen.getByTestId('is-live').textContent).toBe('false');
  });

  it('supports initialMode override prop', () => {
    render(
      <ModeProvider initialMode="live">
        <ModeConsumer />
      </ModeProvider>
    );

    expect(screen.getByTestId('mode-value').textContent).toBe('live');
    expect(screen.getByTestId('is-live').textContent).toBe('true');
  });

  it('toggles mode when toggle function is invoked', () => {
    render(
      <ModeProvider initialMode="demo">
        <ModeConsumer />
      </ModeProvider>
    );

    const toggleBtn = screen.getByText('Toggle');
    act(() => {
      toggleBtn.click();
    });

    expect(screen.getByTestId('mode-value').textContent).toBe('live');
    expect(screen.getByTestId('is-live').textContent).toBe('true');
  });

  it('sets explicit mode when setMode is called', () => {
    render(
      <ModeProvider initialMode="demo">
        <ModeConsumer />
      </ModeProvider>
    );

    const setLiveBtn = screen.getByText('Set Live');
    act(() => {
      setLiveBtn.click();
    });

    expect(screen.getByTestId('mode-value').textContent).toBe('live');
  });

  it('throws an error when useMode is called outside ModeProvider', () => {
    expect(() => render(<ModeConsumer />)).toThrow(
      'useMode must be used within a ModeProvider'
    );
  });
});
