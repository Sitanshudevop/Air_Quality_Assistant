// Unit tests for ai-status health check endpoint.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from './ai-status.js';

describe('AI Status Endpoint', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns configured: true when key is set', async () => {
    process.env.GEMINI_API_KEY = 'valid-key';
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const json = await res.json();
    expect(json).toEqual({ configured: true });
  });

  it('returns configured: false when key is absent or blank', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ configured: false });
  });
});
