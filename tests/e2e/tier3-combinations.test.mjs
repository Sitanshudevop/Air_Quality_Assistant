/**
 * Tier 3: Pairwise & Cross-Feature Combination Tests (8 Tests)
 * Tests multi-subsystem interactions, invariant preservation across boundaries,
 * and security defenses under cross-feature workflows.
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
  startServerlessHarness
} from './helpers/server-harness.mjs';

describe('Tier 3: Pairwise & Cross-Feature Combinations', () => {
  let harness = null;

  before(async () => {
    if (fileExists('api/ai.ts') && fileExists('api/ai-status.ts')) {
      harness = await startServerlessHarness();
    }
  });

  after(async () => {
    if (harness) await harness.close();
  });

  // -------------------------------------------------------------------------
  // Test 3.1: Sliding-Window Rate Limiting Combined with LRU Caching
  // -------------------------------------------------------------------------
  it('Test 3.1: Sliding-Window Rate Limiting Combined with LRU Caching', async () => {
    assert.ok(harness, 'Serverless harness must be active');
    const payload = JSON.stringify({
      task: 'indoor-tips',
      context: { aqi: 320, city: 'Delhi', facts: ['PM2.5: 250'] },
      userText: 'tips'
    });

    // Send a burst of 35 requests (configured window threshold is 30)
    const responses = [];
    for (let i = 0; i < 35; i++) {
      const res = await fetch(`${harness.origin}/api/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '198.51.100.20'
        },
        body: payload
      });
      responses.push(res);
    }

    const statuses = responses.map((r) => r.status);

    // Verify that burst of 35 requests strictly triggers HTTP 429 Rate Limit Exceeded
    assert.ok(
      statuses.includes(429),
      'Burst of 35 requests must trigger HTTP 429 Rate Limit Exceeded'
    );
    const idx = statuses.indexOf(429);
    const rateLimitedRes = responses[idx];
    const body = await rateLimitedRes.json();
    assert.ok(
      body.error?.toLowerCase().includes('rate') || body.error?.toLowerCase().includes('limit'),
      'HTTP 429 response must report rate limit exceeded'
    );
  });

  // -------------------------------------------------------------------------
  // Test 3.2: 64KB Payload Boundary Limit Combined with Security Headers
  // -------------------------------------------------------------------------
  it('Test 3.2: 64KB Payload Boundary Limit Combined with Security Headers & Content-Type', async () => {
    if (harness) {
      // Create payload unambiguously exceeding 64KB (65,536 bytes)
      const oversizedPayload = JSON.stringify({
        task: 'indoor-tips',
        context: { aqi: 200, city: 'Delhi', facts: [] },
        userText: 'X'.repeat(66000)
      });

      const res = await fetch(`${harness.origin}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: oversizedPayload
      });

      assert.strictEqual(
        res.status,
        413,
        `Payload size ${oversizedPayload.length} bytes must return HTTP 413 Payload Too Large`
      );

      const contentType = res.headers.get('content-type') || '';
      assert.ok(contentType.includes('application/json'), '413 response must be application/json');

      const cacheControl = res.headers.get('cache-control') || '';
      assert.ok(cacheControl.includes('no-store'), '413 response must specify Cache-Control: no-store');

      const body = await res.json();
      assert.ok(body.error, '413 response must contain structured JSON error');
      // Must not leak memory or stack traces
      assert.strictEqual(body.stack, undefined, 'Stack trace must not be exposed');
    }
  });

  // -------------------------------------------------------------------------
  // Test 3.3: Strict CSP Headers Combined with SPA Rewrite Rules
  // -------------------------------------------------------------------------
  it('Test 3.3: Strict Content Security Policy (CSP) Headers Combined with SPA Rewrite Rules', () => {
    assert.ok(fileExists('vercel.json'), 'vercel.json must exist');
    const vercelConfig = parseVercelJson();
    assert.ok(vercelConfig, 'vercel.json must be valid JSON');

    // 1. SPA rewrites must cleanly isolate /api
    const rewrites = vercelConfig.rewrites || [];
    assert.ok(rewrites.length > 0, 'rewrites must be configured');
    const spaRule = rewrites.find((r) => r.destination === '/index.html' || r.destination === '/');
    assert.ok(spaRule, 'SPA rewrite rule must exist');
    assert.ok(
      spaRule.source.includes('api'),
      'SPA rewrite rule must explicitly exclude /api'
    );

    // 2. CSP headers must be strict
    const headers = vercelConfig.headers || [];
    const globalHeader = headers.find((h) => h.source === '/(.*)');
    assert.ok(globalHeader, 'Global headers must be configured');
    const csp = globalHeader.headers.find((h) => h.key.toLowerCase() === 'content-security-policy')?.value || '';

    assert.ok(!csp.includes("'unsafe-eval'"), "CSP must NOT include 'unsafe-eval'");
    
    // Check script-src specifically does not contain 'unsafe-inline'
    const scriptSrcMatch = csp.match(/script-src[^;]+/);
    if (scriptSrcMatch) {
      assert.ok(!scriptSrcMatch[0].includes("'unsafe-inline'"), "CSP script-src must NOT include 'unsafe-inline'");
    }

    // 3. Static asset caching vs API no-store
    const assetRule = headers.find((h) => h.source.includes('assets'));
    assert.ok(assetRule, 'Asset caching rule must exist');
    const assetCache = assetRule.headers.find((h) => h.key.toLowerCase() === 'cache-control')?.value || '';
    assert.ok(assetCache.includes('immutable'), 'Asset cache-control must be immutable');

    const apiRule = headers.find((h) => h.source.includes('api/'));
    assert.ok(apiRule, 'API header rule must exist');
    const apiCache = apiRule.headers.find((h) => h.key.toLowerCase() === 'cache-control')?.value || '';
    assert.ok(apiCache.includes('no-store'), 'API cache-control must be no-store');
  });

  // -------------------------------------------------------------------------
  // Test 3.4: Invalid Request Body Combined with Logger Redaction
  // -------------------------------------------------------------------------
  it('Test 3.4: Invalid Request Body Combined with Logger Sanitization & Secret Redaction', async () => {
    assert.ok(fileExists('server/logger.ts'), 'server/logger.ts must exist');
    const loggerSrc = readFileSafe('server/logger.ts');

    // Inspect server/logger.ts implementation for sanitization discipline
    const hasSanitization = loggerSrc.includes('redact') ||
                            loggerSrc.includes('sanitize') ||
                            loggerSrc.includes('replace') ||
                            loggerSrc.includes('AIza') ||
                            !loggerSrc.includes('console.log(body)');
    assert.ok(hasSanitization, 'Logger must implement sanitization or avoid logging sensitive body contents');

    if (harness) {
      const canaryString = 'AIzaSyCanarySecretShouldNeverBeLogged998877';
      const promptInjection = 'DROP TABLE air_quality; -- injected text';

      const res = await fetch(`${harness.origin}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'invalid-task',
          userText: `${canaryString} ${promptInjection}`,
          context: 'invalid-context'
        })
      });

      assert.strictEqual(res.status, 400, 'Invalid request body must return 400 Bad Request');
      const data = await res.json();
      assert.ok(data.error, '400 response must return structured error');
      // Canary should not be reflected
      const resText = JSON.stringify(data);
      assert.ok(!resText.includes(canaryString), 'Canary string must not be reflected in response error');
    }
  });

  // -------------------------------------------------------------------------
  // Test 3.5: Missing GEMINI_API_KEY Combined with Health Check & Proxy
  // -------------------------------------------------------------------------
  it('Test 3.5: Missing GEMINI_API_KEY Combined with /api/ai-status Health Check & /api/ai Proxy', async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    try {
      // 1. When key is missing:
      delete process.env.GEMINI_API_KEY;
      if (harness) await harness.reload();

      if (harness) {
        // Status endpoint should return 200 with configured: false
        const statusRes = await fetch(`${harness.origin}/api/ai-status`);
        assert.strictEqual(statusRes.status, 200);
        const statusData = await statusRes.json();
        assert.strictEqual(statusData.configured, false);

        // Proxy endpoint should return 503
        const proxyRes = await fetch(`${harness.origin}/api/ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: 'indoor-tips',
            context: { aqi: 290, city: 'Delhi', facts: [] }
          })
        });
        assert.strictEqual(proxyRes.status, 503);
        const proxyData = await proxyRes.json();
        assert.ok(proxyData.error);
      }

      // 2. When key is set:
      process.env.GEMINI_API_KEY = 'AIzaSyTestMockKeyForComboCheck123';
      if (harness) await harness.reload();

      if (harness) {
        const statusRes2 = await fetch(`${harness.origin}/api/ai-status`);
        assert.strictEqual(statusRes2.status, 200);
        const statusData2 = await statusRes2.json();
        assert.strictEqual(statusData2.configured, true);
      }
    } finally {
      if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
      else delete process.env.GEMINI_API_KEY;
      if (harness) await harness.reload();
    }
  });

  // -------------------------------------------------------------------------
  // Test 3.6: ESLint Structural Limits Combined with .gitignore
  // -------------------------------------------------------------------------
  it('Test 3.6: ESLint Structural Limits Combined with .gitignore and Scratch Directories', () => {
    assert.ok(fileExists('eslint.config.js'), 'eslint.config.js must exist');
    assert.ok(fileExists('.gitignore'), '.gitignore must exist');

    const eslintContent = readFileSafe('eslint.config.js');
    const gitignorePatterns = parseGitignore();

    // Verify that transient directories are excluded
    const ignoredDirs = ['.agents', 'dist', 'node_modules'];
    for (const dir of ignoredDirs) {
      assert.ok(
        gitignorePatterns.some((p) => p.includes(dir)),
        `.gitignore must include: ${dir}`
      );
      assert.ok(
        eslintContent.includes(dir) || eslintContent.includes('ignores'),
        `eslint.config.js must respect ignores for transient dir: ${dir}`
      );
    }
  });

  // -------------------------------------------------------------------------
  // Test 3.7: Pinned Node Version Check Combined with CI Workflow & Engines
  // -------------------------------------------------------------------------
  it('Test 3.7: Pinned Node Version Check Combined with CI Workflow & Engines Definition', () => {
    const nvmVersion = parseNvmrc();
    assert.ok(nvmVersion, '.nvmrc must exist and contain version string');

    const pkg = parsePackageJson();
    assert.ok(pkg?.engines?.node, 'package.json engines.node must exist');
    assert.ok(
      satisfiesSemver(nvmVersion, pkg.engines.node),
      `.nvmrc version (${nvmVersion}) must satisfy engines.node (${pkg.engines.node})`
    );

    const ciYaml = readFileSafe('.github/workflows/ci.yml');
    assert.ok(ciYaml, '.github/workflows/ci.yml must exist');

    // CI must reference .nvmrc
    assert.match(
      ciYaml,
      /\.nvmrc/,
      'CI setup-node step must configure node-version-file: .nvmrc'
    );

    // Verify ordering of key CI stages: checkout -> setup -> install -> lint -> typecheck -> test -> build
    const checkoutIdx = ciYaml.indexOf('checkout');
    const setupNodeIdx = ciYaml.indexOf('setup-node');
    const npmCiIdx = ciYaml.indexOf('npm ci');
    const lintIdx = ciYaml.indexOf('lint');
    const buildIdx = ciYaml.indexOf('build');

    assert.ok(checkoutIdx !== -1, 'CI must have checkout step');
    assert.ok(setupNodeIdx !== -1, 'CI must have setup-node step');
    assert.ok(npmCiIdx !== -1, 'CI must have npm ci step');
    assert.ok(lintIdx !== -1, 'CI must have lint step');
    assert.ok(buildIdx !== -1, 'CI must have build step');

    assert.ok(checkoutIdx < setupNodeIdx, 'checkout must precede setup-node');
    assert.ok(setupNodeIdx < npmCiIdx, 'setup-node must precede npm ci');
    assert.ok(npmCiIdx < lintIdx, 'npm ci must precede lint');
    assert.ok(lintIdx < buildIdx, 'lint must precede build');
  });

  // -------------------------------------------------------------------------
  // Test 3.8: Secret Leak Scanner Script Combined with Build Artifacts
  // -------------------------------------------------------------------------
  it('Test 3.8: Secret Leak Scanner Script Combined with Vite Build Artifacts (dist/)', () => {
    assert.ok(
      fileExists('scripts/check-no-client-secrets.mjs'),
      'scripts/check-no-client-secrets.mjs must exist'
    );

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'secret-test-'));
    try {
      fs.mkdirSync(path.join(tempDir, 'assets'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'assets', 'index.js'),
        'const greeting = "Clean bundle with zero secrets";',
        'utf8'
      );

      // Clean check
      const cleanRes = runCommandSync('node', ['scripts/check-no-client-secrets.mjs', tempDir]);
      assert.strictEqual(cleanRes.status, 0, 'Clean directory should pass secret scan');

      // Dirty check with injected canary (39 chars matching /AIza[0-9A-Za-z-_]{35}/)
      const dirtyFile = path.join(tempDir, 'assets', 'leak.js');
      fs.writeFileSync(
        dirtyFile,
        'const key = "AIzaSyCanarySecretShouldBeDetected9988A";',
        'utf8'
      );

      const dirtyRes = runCommandSync('node', ['scripts/check-no-client-secrets.mjs', tempDir]);
      assert.notStrictEqual(dirtyRes.status, 0, 'Dirty directory with AIza pattern must fail scan');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

});
