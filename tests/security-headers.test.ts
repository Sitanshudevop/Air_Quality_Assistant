// Security configuration tests verifying CSP parity and R4 HTTP headers.
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

interface VercelHeaderRule {
  source: string;
  headers: Array<{ key: string; value: string }>;
}

interface VercelConfig {
  headers: VercelHeaderRule[];
  rewrites: Array<{ source: string; destination: string }>;
}

function readVercelConfig(): VercelConfig {
  const raw = fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf8');
  return JSON.parse(raw) as VercelConfig;
}

describe('R4 CSP & HTTP Security Headers', () => {
  it('enforces exact CSP parity between vercel.json and index.html (excluding frame-ancestors)', () => {
    const vercel = readVercelConfig();
    const globalHeaders = vercel.headers.find((h) => h.source === '/(.*)')?.headers ?? [];
    const httpCsp =
      globalHeaders.find((h) => h.key.toLowerCase() === 'content-security-policy')?.value ?? '';

    expect(httpCsp).toContain("frame-ancestors 'none';");
    expect(httpCsp).toContain('https://air-quality-api.open-meteo.com');
    expect(httpCsp).toContain('https://api.open-meteo.com');
    expect(httpCsp).toContain('https://geocoding-api.open-meteo.com');
    expect(httpCsp).not.toContain('generativelanguage.googleapis.com');
    expect(httpCsp).not.toContain('unsafe-eval');

    const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const metaMatch = indexHtml.match(
      /<meta\s+http-equiv="Content-Security-Policy"[^>]*content="([^"]+)"/i
    );
    expect(metaMatch).not.toBeNull();
    const metaCsp = metaMatch?.[1] ?? '';
    expect(metaCsp).not.toContain('frame-ancestors');
    expect(httpCsp.replace(" frame-ancestors 'none';", '')).toBe(metaCsp);
  });

  it('enforces HSTS, nosniff, DENY framing, referrer, permissions, caching, and SPA rewrite', () => {
    const vercel = readVercelConfig();
    const globalHeaders = vercel.headers.find((h) => h.source === '/(.*)')?.headers ?? [];
    const headerMap = new Map(globalHeaders.map((h) => [h.key.toLowerCase(), h.value]));

    expect(headerMap.get('strict-transport-security')).toContain('max-age=63072000');
    expect(headerMap.get('x-content-type-options')).toBe('nosniff');
    expect(headerMap.get('x-frame-options')).toBe('DENY');
    expect(headerMap.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(headerMap.get('permissions-policy')).toBe('geolocation=(self), microphone=(), camera=()');

    const assetsCache = vercel.headers
      .find((h) => h.source === '/assets/(.*)')
      ?.headers.find((h) => h.key.toLowerCase() === 'cache-control')?.value;
    expect(assetsCache).toContain('immutable');

    const htmlCache = vercel.headers
      .find((h) => h.source === '/index.html')
      ?.headers.find((h) => h.key.toLowerCase() === 'cache-control')?.value;
    expect(htmlCache).toContain('must-revalidate');

    const apiCache = vercel.headers
      .find((h) => h.source === '/api/(.*)')
      ?.headers.find((h) => h.key.toLowerCase() === 'cache-control')?.value;
    expect(apiCache).toContain('no-store');

    const spaRewrite = vercel.rewrites.find((r) => r.destination === '/index.html');
    expect(spaRewrite?.source).toBe('/((?!api/).*)');
  });
});
