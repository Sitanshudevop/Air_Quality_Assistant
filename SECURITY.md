# Security Architecture & Hardening Status

This document summarizes the R4 security controls enforced by Saans across hosting headers, client CSP, serverless API boundaries, input/storage validation, and dependency hygiene.

## 1. Content Security Policy (CSP) Parity

- **HTTP Header (`vercel.json`)**:
  `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://fonts.googleapis.com https://air-quality-api.open-meteo.com https://api.open-meteo.com https://geocoding-api.open-meteo.com https://api.bigdatacloud.net https://nominatim.openstreetmap.org; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';`
- **Active External Hosts**:
  - `air-quality-api.open-meteo.com`, `api.open-meteo.com`, `geocoding-api.open-meteo.com` — live AQI, hourly dispersion weather, and city lookup.
  - `api.bigdatacloud.net`, `nominatim.openstreetmap.org` — reverse-geocoding for 2-decimal rounded browser coordinates when *"Use My Location"* is triggered.
  - `fonts.googleapis.com`, `fonts.gstatic.com` — Plus Jakarta Sans font stylesheet and font binaries.
- **HTML `<meta>` (`index.html`)**:
  Enforces the exact same directives as `vercel.json`, excluding `frame-ancestors 'none'` (which is valid only in HTTP response headers).
- No `'unsafe-eval'`, no script `'unsafe-inline'`, and no client-side `generativelanguage.googleapis.com` origin are permitted.
- Parity is verified automatically by `tests/security-headers.test.ts`.

## 2. HTTP Security, Caching & SPA Rewrite Headers (`vercel.json`)

- **Global headers (`/(.*)`)**:
  - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options`: `nosniff`
  - `X-Frame-Options`: `DENY`
  - `Referrer-Policy`: `strict-origin-when-cross-origin`
  - `Permissions-Policy`: `geolocation=(self), microphone=(), camera=()`
- **Cache-Control**:
  - `/assets/(.*)`: `public, max-age=31536000, immutable`
  - `/index.html`: `public, max-age=0, must-revalidate`
  - `/api/(.*)`: `no-store, max-age=0`
- **SPA Rewrite**: `/((?!api/).*)` -> `/index.html` (excludes `/api/*` serverless endpoints).

## 3. Server-Only Secrets & Build Verification

- `GEMINI_API_KEY` is read exclusively in serverless functions (`api/`, `server/`) and is never referenced with a `VITE_` prefix or exposed in client code (`src/`).
- `npm run check:no-client-secrets` (`scripts/check-no-client-secrets.mjs`, tested in `scripts/check-no-client-secrets.test.ts` and CI) scans `dist/` after every build to ensure zero API keys or secret patterns ship in the client bundle.

## 4. Input Sanitization, Storage Validation & Privacy

- **Input bounds**: Text/tel inputs enforce `maxLength` (`100` for city/society, `20` for emergency phone, `1000` for assistant prompts) matching sanitizer and Zod schema limits.
- **Zod-validated storage**: Persisted browser state in `localStorage` and `sessionStorage` (`profile.ts`, `chatUtils.ts`, `manualReading.ts`, `cache.ts`) is validated via Zod schemas (`safeParse`). Corrupted or schema-invalid payloads are safely purged and fall back to defaults without throwing.
- **External links & privacy**: External `target="_blank"` links include `rel="noopener noreferrer"`. Coordinates sent to Open-Meteo, `api.bigdatacloud.net`, or `nominatim.openstreetmap.org` (or stored in cache keys) are rounded to 2 decimal places (~1.1 km), and `AppFooter` states the in-browser privacy guarantee.

## 5. Dependency Audit & npm `overrides` Status

- **Current status**: No npm `"overrides"` entries are currently required in `package.json`.
- `npm audit --audit-level=low` reports **0 vulnerabilities** across all installed dependencies, and CI runs `npm audit --audit-level=high` on every push/PR.
- If a transitive vulnerability is later reported with no upstream minor/patch release, add a targeted `"overrides"` entry in `package.json` with its advisory ID documented here.
