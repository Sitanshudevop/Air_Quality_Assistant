// Unit tests for client secret leak scanner.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { scanDirectory, FORBIDDEN_PATTERNS } from './check-no-client-secrets.mjs';

describe('Secret Scanner', () => {
  const tmpDir = path.resolve(process.cwd(), '.test-tmp-scan');

  beforeEach(() => {
    vi.restoreAllMocks();
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('detects no leaks in clean directory', () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'clean.js'), 'export const a = 1;');
    const leaks = scanDirectory(tmpDir);
    expect(leaks).toHaveLength(0);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('flags forbidden secret patterns in bundles', () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'leaky.js'),
      'const key = "AIzaSyD-fakeKey1234567890123456789012345";'
    );
    const leaks = scanDirectory(tmpDir);
    expect(leaks.length).toBeGreaterThan(0);
    expect(leaks[0]).toContain('Detected pattern');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('flags AQ. secret pattern in bundles', () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'aq-leaky.js'),
      'const airQualityKey = "AQ.fakeAirQualityKey12345";'
    );
    const leaks = scanDirectory(tmpDir);
    expect(leaks.length).toBeGreaterThan(0);
    expect(leaks[0]).toContain('Detected pattern');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('handles non-existent target directory gracefully', () => {
    const leaks = scanDirectory(path.join(tmpDir, 'non-existent'));
    expect(leaks[0]).toContain('Target directory does not exist');
  });

  it('verifies forbidden regex patterns', () => {
    expect(FORBIDDEN_PATTERNS.some((p) => p.test('process.env.GEMINI_KEY'))).toBe(true);
    expect(FORBIDDEN_PATTERNS.some((p) => p.test('VITE_API_SECRET'))).toBe(true);
    expect(FORBIDDEN_PATTERNS.some((p) => p.test('AQ.fakeAirQualityKey12345'))).toBe(true);
    expect(FORBIDDEN_PATTERNS.some((p) => p.test('AIzaSyD-fakeKey1234567890123456789012345'))).toBe(true);
  });
});
