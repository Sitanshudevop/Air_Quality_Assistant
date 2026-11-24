// Unit tests for client-side logging utility.
import { describe, it, expect, vi } from 'vitest';
import { logInfo, logError } from './logger.js';

describe('Client Logger', () => {
  it('logs info with and without metadata', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logInfo('Test info');
    expect(infoSpy).toHaveBeenCalledWith('[Saans Info] Test info');

    logInfo('Test info with data', { action: 'init', status: 200 });
    expect(infoSpy).toHaveBeenCalledWith('[Saans Info] Test info with data', {
      action: 'init',
      status: 200,
    });
    infoSpy.mockRestore();
  });

  it('logs error with and without metadata', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logError('Test error');
    expect(errorSpy).toHaveBeenCalledWith('[Saans Error] Test error');

    logError('Test error with data', { action: 'fetch_failed', error: 'Network error' });
    expect(errorSpy).toHaveBeenCalledWith('[Saans Error] Test error with data', {
      action: 'fetch_failed',
      error: 'Network error',
    });
    errorSpy.mockRestore();
  });
});
