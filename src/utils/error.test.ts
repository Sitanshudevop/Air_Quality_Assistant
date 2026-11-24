// Unit tests for error utility functions and AppError class.
import { describe, it, expect } from 'vitest';
import { AppError, getErrorMessage, getErrorStatusCode } from './error.js';

describe('Error Utilities', () => {
  it('instantiates AppError with default and custom values', () => {
    const defaultErr = new AppError('Default error');
    expect(defaultErr.name).toBe('AppError');
    expect(defaultErr.statusCode).toBe(500);
    expect(defaultErr.details).toBeUndefined();

    const customErr = new AppError('Custom error', 400, { field: 'task' });
    expect(customErr.statusCode).toBe(400);
    expect(customErr.details).toEqual({ field: 'task' });
  });

  it('extracts messages correctly across error types', () => {
    expect(getErrorMessage(new Error('Boom'))).toBe('Boom');
    expect(getErrorMessage('String failure')).toBe('String failure');
    expect(getErrorMessage({ unknown: true })).toBe('An unexpected error occurred');
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
  });

  it('determines status codes correctly', () => {
    const appErr = new AppError('Not found', 404);
    expect(getErrorStatusCode(appErr)).toBe(404);
    expect(getErrorStatusCode(new Error('Generic'))).toBe(500);
    expect(getErrorStatusCode('string', 418)).toBe(418);
  });
});
