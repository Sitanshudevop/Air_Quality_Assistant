// Unit tests for server sanitized logging utility.
import { describe, it, expect, vi } from 'vitest';
import { logServerInfo, logServerWarn, logServerError } from './logger.js';

describe('Server Logger', () => {
  it('logs info, warn, and error with sanitized meta', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logServerInfo('req_ok', { status: 200, model: 'gemini-2.5-flash', task: 'chat' });
    expect(infoSpy).toHaveBeenCalled();
    const infoPayload = JSON.parse(infoSpy.mock.calls[0][0]);
    expect(infoPayload.action).toBe('req_ok');
    expect(infoPayload.status).toBe(200);

    logServerWarn('rate_warn', { reason: 'limit_approaching' });
    expect(warnSpy).toHaveBeenCalled();
    const warnPayload = JSON.parse(warnSpy.mock.calls[0][0]);
    expect(warnPayload.level).toBe('warn');

    logServerError('req_err', { errorName: 'Timeout' });
    expect(errorSpy).toHaveBeenCalled();

    logServerInfo('no_meta');
    expect(infoSpy).toHaveBeenCalledTimes(2);

    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
