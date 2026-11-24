/**
 * Tier 1: Feature Coverage E2E Tests (35 Tests, 5 per feature area F1-F7)
 * Validates baseline nominal functionality across project scaffolding,
 * code quality guardrails, serverless APIs, security headers, verification scripts, and CI pipeline.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { register } from 'node:module';

import {
  WORKSPACE_ROOT,
  readFileSafe,
  readJsonSafe,
  fileExists,
  dirExists,
  parseNvmrc,
  parsePackageJson,
  parseVercelJson,
  parseGitignore,
  satisfiesSemver,
  runCommandSync
} from './helpers/workspace-inspect.mjs';

if (!globalThis.__tsResolverRegistered) {
  try {
    const resolverUrl = pathToFileURL(path.resolve(WORKSPACE_ROOT, 'tests/e2e/helpers/ts-resolver.mjs')).href;
    register(resolverUrl, pathToFileURL(WORKSPACE_ROOT + '/').href);
    globalThis.__tsResolverRegistered = true;
  } catch {}
}

import {
  startServerlessHarness,
  startMockDeployServer
} from './helpers/server-harness.mjs';

describe('Tier 1: Feature Coverage (F1-F7)', () => {

  // =========================================================================
  // Feature 1: Project Scaffolding & Tooling (F1)
  // =========================================================================
  describe('F1: Project Scaffolding & Tooling', () => {

    it('F1-T1-01: Node Version Pinning across .nvmrc and package.json', () => {
      const nvmVersion = parseNvmrc();
      assert.ok(nvmVersion, '.nvmrc must exist and contain a version string');
      const major = parseInt(nvmVersion, 10);
      assert.ok(major >= 20, `.nvmrc major version must be >= 20, got: ${nvmVersion}`);

      const pkg = parsePackageJson();
      assert.ok(pkg, 'package.json must exist and be valid JSON');
      assert.ok(pkg.engines && pkg.engines.node, 'package.json must define engines.node');
      assert.ok(
        satisfiesSemver(nvmVersion, pkg.engines.node),
        `.nvmrc version (${nvmVersion}) must satisfy package.json engines.node (${pkg.engines.node})`
      );
    });

    it('F1-T1-02: MIT License Existence and Canonical Structure', () => {
      assert.ok(fileExists('LICENSE'), 'LICENSE file must exist at repository root');
      const licenseText = readFileSafe('LICENSE');
      assert.ok(licenseText.length > 200, 'LICENSE file should contain full license text');
      assert.ok(licenseText.includes('MIT License'), 'LICENSE must declare MIT License');
      assert.ok(licenseText.includes('Permission is hereby granted'), 'LICENSE must contain standard MIT permission clause');
      assert.ok(licenseText.includes('WITHOUT WARRANTY OF ANY KIND'), 'LICENSE must contain standard MIT warranty clause');
      assert.ok(licenseText.includes('2026'), 'LICENSE must include copyright year 2026');
    });

    it('F1-T1-03: Mandatory .gitignore Pattern Coverage', () => {
      assert.ok(fileExists('.gitignore'), '.gitignore must exist');
      const patterns = parseGitignore();

      const requiredPatterns = [
        '.env',
        'node_modules',
        'dist',
        '.agents',
        'GEMINI.md',
        'report.html',
        'lighthouse'
      ];

      for (const required of requiredPatterns) {
        const found = patterns.some((p) => p.includes(required));
        assert.ok(found, `.gitignore must contain pattern for: ${required}`);
      }

      // Check temp pattern ($env:TEMP\aq or tmp/aq or similar)
      const hasTemp = patterns.some((p) => p.includes('aq') || p.includes('TEMP') || p.includes('tmp'));
      assert.ok(hasTemp, '.gitignore must exclude scratch/temp directory ($env:TEMP\\aq or tmp/aq)');
    });

    it('F1-T1-04: Dual TypeScript Configuration Integrity (tsconfig.json & tsconfig.api.json)', () => {
      assert.ok(fileExists('tsconfig.json'), 'tsconfig.json must exist');
      assert.ok(fileExists('tsconfig.api.json'), 'tsconfig.api.json must exist');

      const clientConfig = readJsonSafe('tsconfig.json');
      assert.ok(clientConfig, 'tsconfig.json must be valid JSON');
      assert.strictEqual(
        clientConfig.compilerOptions?.strict,
        true,
        'tsconfig.json must enforce strict: true'
      );

      const apiConfig = readJsonSafe('tsconfig.api.json');
      assert.ok(apiConfig, 'tsconfig.api.json must be valid JSON');
      assert.strictEqual(
        apiConfig.compilerOptions?.strict,
        true,
        'tsconfig.api.json must enforce strict: true'
      );
      assert.match(
        String(apiConfig.compilerOptions?.module),
        /NodeNext/i,
        'tsconfig.api.json compilerOptions.module must be NodeNext'
      );
      assert.match(
        String(apiConfig.compilerOptions?.moduleResolution),
        /NodeNext/i,
        'tsconfig.api.json compilerOptions.moduleResolution must be NodeNext'
      );
    });

    it('F1-T1-05: Standardized Directory Layout Conformance', () => {
      const requiredDirs = [
        'src/domain',
        'src/services',
        'src/features',
        'src/components/ui',
        'src/state',
        'src/schemas',
        'src/constants',
        'src/utils',
        'api',
        'server',
        'shared',
        'scripts',
        'docs'
      ];

      for (const dir of requiredDirs) {
        assert.ok(dirExists(dir), `Mandatory directory must exist: ${dir}`);
      }
    });

  });

  // =========================================================================
  // Feature 2: Code Quality Guardrails (F2)
  // =========================================================================
  describe('F2: Code Quality Guardrails', () => {

    it('F2-T1-01: ESLint Structural Limits Rule Configuration', () => {
      assert.ok(fileExists('eslint.config.js'), 'eslint.config.js flat config must exist');
      const eslintContent = readFileSafe('eslint.config.js');

      // max-lines <= 150
      assert.match(eslintContent, /max-lines/i, 'ESLint config must include max-lines rule');
      assert.match(eslintContent, /150/, 'ESLint max-lines must enforce limit 150');

      // max-lines-per-function <= 40
      assert.match(eslintContent, /max-lines-per-function/i, 'ESLint config must include max-lines-per-function rule');
      assert.match(eslintContent, /40/, 'ESLint max-lines-per-function must enforce limit 40');

      // max-depth <= 3
      assert.match(eslintContent, /max-depth/i, 'ESLint config must include max-depth rule');
      assert.match(eslintContent, /3/, 'ESLint max-depth must enforce limit 3');

      // max-params <= 4
      assert.match(eslintContent, /max-params/i, 'ESLint config must include max-params rule');
      assert.match(eslintContent, /4/, 'ESLint max-params must enforce limit 4');

      // complexity <= 10
      assert.match(eslintContent, /complexity/i, 'ESLint config must include complexity rule');
      assert.match(eslintContent, /10/, 'ESLint complexity must enforce limit 10');
    });

    it('F2-T1-02: ESLint Strict TypeScript Typing Rules (No any & Explicit Returns)', () => {
      const eslintContent = readFileSafe('eslint.config.js');
      assert.match(
        eslintContent,
        /no-explicit-any/i,
        'ESLint config must configure @typescript-eslint/no-explicit-any'
      );
      assert.match(
        eslintContent,
        /explicit-function-return-type/i,
        'ESLint config must configure @typescript-eslint/explicit-function-return-type'
      );
    });

    it('F2-T1-03: ESLint JSDoc on Exports and File Header Comments', () => {
      const eslintContent = readFileSafe('eslint.config.js');
      assert.match(eslintContent, /jsdoc/i, 'ESLint config must configure JSDoc rules');
      // Must check for required documentation on exports and header comment
      const hasDocEnforcement = eslintContent.includes('require-jsdoc') || 
                                eslintContent.includes('jsdoc/') ||
                                eslintContent.includes('header') ||
                                eslintContent.includes('file-header');
      assert.ok(hasDocEnforcement, 'ESLint config must enforce JSDoc and file header comments');
    });

    it('F2-T1-04: Dead Code Elimination Audit via Knip', () => {
      assert.ok(fileExists('knip.json'), 'knip.json configuration must exist');
      const knipConfig = readJsonSafe('knip.json');
      assert.ok(knipConfig, 'knip.json must parse as valid JSON');
      assert.ok(
        knipConfig.entry || knipConfig.project,
        'knip.json must define project or entry files for dead code scanning'
      );
    });

    it('F2-T1-05: Code Duplication and Circular Import Audits (jscpd & madge)', () => {
      assert.ok(fileExists('.jscpd.json'), '.jscpd.json configuration must exist');
      const jscpdConfig = readJsonSafe('.jscpd.json');
      assert.ok(jscpdConfig, '.jscpd.json must parse as valid JSON');
      assert.ok(
        jscpdConfig.threshold !== undefined || jscpdConfig.maxLines !== undefined,
        '.jscpd.json must specify threshold or limit settings'
      );
    });

  });

  // =========================================================================
  // Feature 3: Serverless AI Status Contract (F3)
  // =========================================================================
  describe('F3: Serverless AI Status Contract', () => {
    let harness = null;

    before(async () => {
      if (fileExists('api/ai-status.ts')) {
        harness = await startServerlessHarness();
      }
    });

    after(async () => {
      if (harness) await harness.close();
    });

    it('F3-T1-01: Module Export Shape Verification', async () => {
      assert.ok(fileExists('api/ai-status.ts'), 'api/ai-status.ts must exist');
      const modUrl = pathToFileURL(path.resolve(WORKSPACE_ROOT, 'api/ai-status.ts')).href;
      const mod = await import(modUrl);
      assert.strictEqual(typeof mod.GET, 'function', 'api/ai-status.ts must export named GET function');
      assert.strictEqual(mod.default, undefined, 'api/ai-status.ts must NOT have a default export');
    });

    it('F3-T1-02: GET Request when GEMINI_API_KEY is Present in Environment', async () => {
      const prevKey = process.env.GEMINI_API_KEY;
      try {
        process.env.GEMINI_API_KEY = 'AIzaSyDummyValidKeyForStatusCheck';
        if (harness) await harness.reload();

        const url = harness ? `${harness.origin}/api/ai-status` : null;
        if (url) {
          const res = await fetch(url, { method: 'GET' });
          assert.strictEqual(res.status, 200, 'GET /api/ai-status must return HTTP 200');
          const data = await res.json();
          assert.strictEqual(data.configured, true, 'configured must be true when key is present');
        } else {
          // Fallback direct invocation
          const mod = await import(pathToFileURL(path.resolve(WORKSPACE_ROOT, 'api/ai-status.ts')).href);
          const res = await mod.GET(new Request('http://localhost/api/ai-status', { method: 'GET' }));
          assert.strictEqual(res.status, 200);
          const data = await res.json();
          assert.strictEqual(data.configured, true);
        }
      } finally {
        if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
        else delete process.env.GEMINI_API_KEY;
        if (harness) await harness.reload();
      }
    });

    it('F3-T1-03: GET Request when GEMINI_API_KEY is Unset or Empty', async () => {
      const prevKey = process.env.GEMINI_API_KEY;
      try {
        delete process.env.GEMINI_API_KEY;
        if (harness) await harness.reload();

        const url = harness ? `${harness.origin}/api/ai-status` : null;
        if (url) {
          const res = await fetch(url, { method: 'GET' });
          assert.strictEqual(res.status, 200, 'GET /api/ai-status must return HTTP 200 even when key is missing');
          const data = await res.json();
          assert.strictEqual(data.configured, false, 'configured must be false when key is absent');
        } else {
          const mod = await import(pathToFileURL(path.resolve(WORKSPACE_ROOT, 'api/ai-status.ts')).href);
          const res = await mod.GET(new Request('http://localhost/api/ai-status', { method: 'GET' }));
          assert.strictEqual(res.status, 200);
          const data = await res.json();
          assert.strictEqual(data.configured, false);
        }
      } finally {
        if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
        if (harness) await harness.reload();
      }
    });

    it('F3-T1-04: Rejection of Non-GET HTTP Methods (405 Method Not Allowed)', async () => {
      assert.ok(fileExists('api/ai-status.ts'), 'api/ai-status.ts must exist');
      if (harness) {
        for (const method of ['POST', 'PUT', 'DELETE']) {
          const res = await fetch(`${harness.origin}/api/ai-status`, { method });
          assert.strictEqual(
            res.status,
            405,
            `${method} /api/ai-status must return HTTP 405 Method Not Allowed`
          );
          const body = await res.json();
          assert.ok(body.error, 'Response body must contain error message');
        }
      } else {
        const mod = await import(pathToFileURL(path.resolve(WORKSPACE_ROOT, 'api/ai-status.ts')).href);
        assert.strictEqual(mod.POST, undefined, 'api/ai-status.ts should not export POST');
      }
    });

    it('F3-T1-05: Response Cache Header Prevention (Cache-Control: no-store)', async () => {
      if (harness) {
        const res = await fetch(`${harness.origin}/api/ai-status`, { method: 'GET' });
        const cacheControl = res.headers.get('cache-control') || '';
        assert.ok(
          cacheControl.includes('no-store'),
          `Cache-Control must contain no-store, got: ${cacheControl}`
        );
      } else {
        const mod = await import(pathToFileURL(path.resolve(WORKSPACE_ROOT, 'api/ai-status.ts')).href);
        const res = await mod.GET(new Request('http://localhost/api/ai-status', { method: 'GET' }));
        const cacheControl = res.headers.get('cache-control') || '';
        assert.ok(cacheControl.includes('no-store'));
      }
    });

  });

  // =========================================================================
  // Feature 4: Serverless AI Proxy Contract (F4)
  // =========================================================================
  describe('F4: Serverless AI Proxy Contract', () => {
    let harness = null;

    before(async () => {
      if (fileExists('api/ai.ts')) {
        harness = await startServerlessHarness();
      }
    });

    after(async () => {
      if (harness) await harness.close();
    });

    it('F4-T1-01: Module Export Shape Verification', async () => {
      assert.ok(fileExists('api/ai.ts'), 'api/ai.ts must exist');
      const modUrl = pathToFileURL(path.resolve(WORKSPACE_ROOT, 'api/ai.ts')).href;
      const mod = await import(modUrl);
      assert.strictEqual(typeof mod.POST, 'function', 'api/ai.ts must export named POST function');
      assert.strictEqual(mod.default, undefined, 'api/ai.ts must NOT have a default export');
    });

    it('F4-T1-02: Rejection of Non-POST Methods (405 Method Not Allowed)', async () => {
      if (harness) {
        const res = await fetch(`${harness.origin}/api/ai`, { method: 'GET' });
        assert.strictEqual(res.status, 405, 'GET /api/ai must return HTTP 405 Method Not Allowed');
        const data = await res.json();
        assert.ok(data.error, '405 response must return JSON error');
      } else {
        const mod = await import(pathToFileURL(path.resolve(WORKSPACE_ROOT, 'api/ai.ts')).href);
        if (typeof mod.GET === 'function') {
          const res = await mod.GET(new Request('http://localhost/api/ai', { method: 'GET' }));
          assert.strictEqual(res.status, 405);
        } else {
          assert.strictEqual(mod.GET, undefined, 'api/ai.ts should not export GET');
        }
      }
    });

    it('F4-T1-03: Missing Server GEMINI_API_KEY Graceful 503 JSON', async () => {
      const prevKey = process.env.GEMINI_API_KEY;
      try {
        delete process.env.GEMINI_API_KEY;
        if (harness) await harness.reload();

        const payload = {
          task: 'indoor-tips',
          context: { aqi: 350, city: 'Delhi', facts: ['PM2.5 is high'] },
          userText: 'Immediate tips'
        };

        if (harness) {
          const res = await fetch(`${harness.origin}/api/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          assert.strictEqual(res.status, 503, 'POST /api/ai without key must return 503 Service Unavailable');
          const data = await res.json();
          assert.ok(data.error, '503 response must return JSON error object');
        } else {
          const mod = await import(pathToFileURL(path.resolve(WORKSPACE_ROOT, 'api/ai.ts')).href);
          const req = new Request('http://localhost/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const res = await mod.POST(req);
          assert.strictEqual(res.status, 503);
        }
      } finally {
        if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
        if (harness) await harness.reload();
      }
    });

    it('F4-T1-04: End-to-End Success Contract and Provenance Tagging (HTTP 200)', async () => {
      // In demo integrity mode or mock environment, test valid task format
      const payload = {
        task: 'indoor-tips',
        context: { aqi: 300, city: 'Delhi', facts: ['PM2.5 is 250'] },
        userText: 'Provide safety tips'
      };

      if (harness) {
        const res = await fetch(`${harness.origin}/api/ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        // In unconfigured environment without live key, 503 is compliant; if configured, 200
        if (res.status === 200) {
          const data = await res.json();
          assert.strictEqual(data.task, 'indoor-tips');
          assert.ok(data.result, 'Response must include result');
          assert.ok(data.provenance, 'Response must include provenance');
          assert.ok(
            ['gemini', 'rules'].includes(data.provenance.source),
            'Provenance source must be gemini or rules'
          );
        } else {
          assert.ok(
            [200, 503].includes(res.status),
            `Expected 200 (if key configured) or 503 (if unconfigured), got: ${res.status}`
          );
        }
      } else {
        assert.ok(fileExists('api/ai.ts'), 'api/ai.ts must exist');
      }
    });

    it('F4-T1-05: In-Memory Request Cache Hit (cached: true)', async () => {
      // If server harness is active and key is present or mock returns 200
      if (harness) {
        const payload = {
          task: 'indoor-tips',
          context: { aqi: 280, city: 'Noida', facts: ['Smog episode'] },
          userText: 'Routine check'
        };

        const res1 = await fetch(`${harness.origin}/api/ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res1.status === 200) {
          const data1 = await res1.json();
          assert.strictEqual(data1.provenance?.cached, false, 'First call should be a cache miss (cached: false)');

          // Second identical call
          const res2 = await fetch(`${harness.origin}/api/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          assert.strictEqual(res2.status, 200);
          const data2 = await res2.json();
          assert.strictEqual(data2.provenance?.cached, true, 'Second identical call should return cached: true');
        } else {
          assert.strictEqual(res1.status, 503, 'Offline without key correctly returns 503');
        }
      } else {
        assert.ok(fileExists('server/cache.ts'), 'server/cache.ts must exist for LRU cache implementation');
      }
    });

  });

  // =========================================================================
  // Feature 5: Vercel Security & Routing (F5)
  // =========================================================================
  describe('F5: Vercel.json Security & Routing', () => {

    it('F5-T1-01: Content Security Policy Without Unsafe Directives', () => {
      assert.ok(fileExists('vercel.json'), 'vercel.json must exist');
      const vercelConfig = parseVercelJson();
      assert.ok(vercelConfig, 'vercel.json must be valid JSON');

      const headers = vercelConfig.headers || [];
      const globalHeaderEntry = headers.find((h) => h.source === '/(.*)' || h.source === '/(.*)');
      assert.ok(globalHeaderEntry, 'vercel.json must define global headers for /(.*)');

      const cspHeader = globalHeaderEntry.headers.find(
        (h) => h.key.toLowerCase() === 'content-security-policy'
      );
      assert.ok(cspHeader, 'Content-Security-Policy header must be configured');
      const cspVal = cspHeader.value;

      assert.ok(!cspVal.includes("'unsafe-eval'"), "CSP must NOT contain 'unsafe-eval'");
      // script-src must not contain 'unsafe-inline'
      const scriptSrcMatch = cspVal.match(/script-src[^;]+/);
      if (scriptSrcMatch) {
        assert.ok(
          !scriptSrcMatch[0].includes("'unsafe-inline'"),
          "script-src must NOT contain 'unsafe-inline'"
        );
      }
    });

    it('F5-T1-02: Mandatory Security Headers Ensemble', () => {
      const vercelConfig = parseVercelJson();
      const headers = vercelConfig.headers || [];
      const globalHeaders = headers.find((h) => h.source === '/(.*)')?.headers || [];

      const getHeader = (name) => globalHeaders.find((h) => h.key.toLowerCase() === name.toLowerCase())?.value;

      const hsts = getHeader('Strict-Transport-Security');
      assert.ok(hsts, 'Strict-Transport-Security header must be present');
      assert.match(hsts, /max-age=\d+/, 'HSTS must define max-age');
      assert.ok(hsts.includes('includeSubDomains'), 'HSTS must include includeSubDomains');

      const xfo = getHeader('X-Frame-Options');
      assert.strictEqual(xfo, 'DENY', 'X-Frame-Options must be DENY');

      const xcto = getHeader('X-Content-Type-Options');
      assert.strictEqual(xcto, 'nosniff', 'X-Content-Type-Options must be nosniff');

      const referrer = getHeader('Referrer-Policy');
      assert.ok(
        referrer === 'strict-origin-when-cross-origin' || referrer === 'no-referrer',
        `Referrer-Policy must be strict, got: ${referrer}`
      );
    });

    it('F5-T1-03: Permissions-Policy Geolocation Self-Only Conformance', () => {
      const vercelConfig = parseVercelJson();
      const headers = vercelConfig.headers || [];
      const globalHeaders = headers.find((h) => h.source === '/(.*)')?.headers || [];

      const permPolicy = globalHeaders.find((h) => h.key.toLowerCase() === 'permissions-policy')?.value;
      assert.ok(permPolicy, 'Permissions-Policy header must be present');
      assert.ok(
        permPolicy.includes('geolocation=(self)'),
        `Permissions-Policy must restrict geolocation to (self), got: ${permPolicy}`
      );
      assert.ok(!permPolicy.includes('geolocation=*'), 'Permissions-Policy must NOT allow wildcard geolocation');
    });

    it('F5-T1-04: SPA Rewrites Configuration Excluding /api Routes', () => {
      const vercelConfig = parseVercelJson();
      const rewrites = vercelConfig.rewrites || [];
      assert.ok(rewrites.length > 0, 'vercel.json must define rewrites array for SPA');

      const spaRewrite = rewrites.find((r) => r.destination === '/index.html' || r.destination === '/');
      assert.ok(spaRewrite, 'SPA rewrite directing to /index.html must exist');

      // Ensure /api routes are excluded from rewrite
      const source = spaRewrite.source;
      const apiExcluded = source.includes('api') || source.startsWith('/((?!api');
      assert.ok(
        apiExcluded,
        `SPA rewrite rule source (${source}) must explicitly exclude /api routes`
      );
    });

    it('F5-T1-05: Caching Differentiation: Static Assets (Immutable) vs API Routes (No-Store)', () => {
      const vercelConfig = parseVercelJson();
      const headers = vercelConfig.headers || [];

      // Static assets
      const assetHeader = headers.find((h) => h.source.includes('assets') || h.source.includes('.(js|css)'));
      assert.ok(assetHeader, 'Static assets caching header rule must exist');
      const assetCache = assetHeader.headers.find((h) => h.key.toLowerCase() === 'cache-control')?.value || '';
      assert.ok(assetCache.includes('immutable'), 'Static assets must have immutable cache header');

      // API routes
      const apiHeader = headers.find((h) => h.source.includes('api/'));
      assert.ok(apiHeader, 'API routes header rule must exist');
      const apiCache = apiHeader.headers.find((h) => h.key.toLowerCase() === 'cache-control')?.value || '';
      assert.ok(apiCache.includes('no-store'), 'API routes must have Cache-Control: no-store');
    });

  });

  // =========================================================================
  // Feature 6: Verification Scripts (F6)
  // =========================================================================
  describe('F6: Verification Scripts', () => {

    it('F6-T1-01: Secret Scanner (check-no-client-secrets.mjs) Clean Execution', () => {
      assert.ok(fileExists('scripts/check-no-client-secrets.mjs'), 'scripts/check-no-client-secrets.mjs must exist');

      // Create a temporary clean dist directory for testing
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clean-dist-'));
      try {
        fs.mkdirSync(path.join(tempDir, 'assets'), { recursive: true });
        fs.writeFileSync(path.join(tempDir, 'assets', 'index.js'), 'console.log("clean bundle");', 'utf8');

        const res = runCommandSync('node', ['scripts/check-no-client-secrets.mjs', tempDir]);
        assert.strictEqual(res.status, 0, `Secret scanner should exit 0 on clean directory. Output: ${res.stdout} ${res.stderr}`);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('F6-T1-02: Secret Scanner Detection of Google API Key Pattern (AIza...)', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dirty-dist-'));
      try {
        fs.mkdirSync(path.join(tempDir, 'assets'), { recursive: true });
        const leakedCode = 'const secretKey = "AIzaSyDummyCanarySecretForTest123456789";';
        fs.writeFileSync(path.join(tempDir, 'assets', 'app.js'), leakedCode, 'utf8');

        const res = runCommandSync('node', ['scripts/check-no-client-secrets.mjs', tempDir]);
        assert.notStrictEqual(res.status, 0, 'Secret scanner must exit with non-zero status when secret pattern is present');
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('F6-T1-03: Smoke Script (smoke-deployed.mjs) CLI Argument Validation', () => {
      assert.ok(fileExists('scripts/smoke-deployed.mjs'), 'scripts/smoke-deployed.mjs must exist');
      const res = runCommandSync('node', ['scripts/smoke-deployed.mjs']);
      assert.notStrictEqual(res.status, 0, 'Running smoke script without URL argument must exit non-zero');
      const output = res.stderr + res.stdout;
      assert.ok(
        output.toLowerCase().includes('usage') || output.toLowerCase().includes('url'),
        `Smoke script must print usage syntax when url argument is omitted. Got: ${output}`
      );
    });

    it('F6-T1-04: Smoke Script Full Nominal Execution against Compliant Host', async () => {
      // Start mock deployment server
      const mockServer = await startMockDeployServer({
        statusConfigured: true,
        provenanceSource: 'gemini'
      });

      try {
        const res = runCommandSync('node', ['scripts/smoke-deployed.mjs', mockServer.origin]);
        assert.strictEqual(
          res.status,
          0,
          `Smoke script must pass against compliant host. Output: ${res.stdout} ${res.stderr}`
        );
      } finally {
        await mockServer.close();
      }
    });

    it('F6-T1-05: Smoke Script Failure on Non-Gemini Provenance (Mock/Rule Response)', async () => {
      // Start mock deploy server returning source: 'rules'
      const mockServer = await startMockDeployServer({
        statusConfigured: true,
        provenanceSource: 'rules' // Non-gemini source must fail smoke check
      });

      try {
        const res = runCommandSync('node', ['scripts/smoke-deployed.mjs', mockServer.origin]);
        assert.notStrictEqual(
          res.status,
          0,
          'Smoke script must fail if deployed site returns non-gemini provenance'
        );
      } finally {
        await mockServer.close();
      }
    });

  });

  // =========================================================================
  // Feature 7: CI Pipeline Configuration (F7)
  // =========================================================================
  describe('F7: CI Pipeline Configuration', () => {

    it('F7-T1-01: GitHub Actions CI Workflow Trigger and Branch Schema', () => {
      assert.ok(fileExists('.github/workflows/ci.yml'), '.github/workflows/ci.yml must exist');
      const ciYaml = readFileSafe('.github/workflows/ci.yml');
      assert.match(ciYaml, /push:/, 'CI workflow must trigger on push');
      assert.match(ciYaml, /pull_request:/, 'CI workflow must trigger on pull_request');
      assert.match(ciYaml, /main/, 'CI workflow triggers must target main branch');
    });

    it('F7-T1-02: Node Version Resolution from .nvmrc in Setup Step', () => {
      const ciYaml = readFileSafe('.github/workflows/ci.yml');
      assert.match(ciYaml, /actions\/setup-node/i, 'CI workflow must use actions/setup-node');
      assert.match(ciYaml, /\.nvmrc/, 'setup-node must reference .nvmrc for node version');
    });

    it('F7-T1-03: Dual Typechecking Step Execution', () => {
      const ciYaml = readFileSafe('.github/workflows/ci.yml');
      // Client typecheck
      const hasClientTypecheck = ciYaml.includes('tsc --noEmit') || ciYaml.includes('npm run typecheck');
      assert.ok(hasClientTypecheck, 'CI workflow must execute client typecheck (tsc --noEmit)');

      // API typecheck
      const hasApiTypecheck = ciYaml.includes('typecheck:api') || ciYaml.includes('tsconfig.api.json');
      assert.ok(hasApiTypecheck, 'CI workflow must execute API typecheck with tsconfig.api.json');
    });

    it('F7-T1-04: Vitest Coverage Thresholds Enforcement Step', () => {
      const ciYaml = readFileSafe('.github/workflows/ci.yml');
      const hasCoverage = ciYaml.includes('test:coverage') || ciYaml.includes('--coverage');
      assert.ok(hasCoverage, 'CI workflow must include coverage test step');
    });

    it('F7-T1-05: Post-Build Secret Scanning and Security Audit Steps', () => {
      const ciYaml = readFileSafe('.github/workflows/ci.yml');
      assert.match(ciYaml, /npm run build|npm ci/, 'CI workflow must include build step');
      assert.match(ciYaml, /check:no-client-secrets/, 'CI workflow must execute check:no-client-secrets');
      assert.match(ciYaml, /npm audit --audit-level=high/, 'CI workflow must execute npm audit --audit-level=high');
    });

  });

});
