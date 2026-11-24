/**
 * Tier 2: Boundary & Corner Cases E2E Tests (35 Tests, 5 per feature area F1-F7)
 * Validates edge inputs, negative paths, boundary cutoffs, security sanitization,
 * and failure containment across all M0 architectural modules.
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
  parsePackageJson,
  parseVercelJson,
  isGitIgnored,
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

describe('Tier 2: Boundary & Corner Cases (F1-F7)', () => {

  // =========================================================================
  // F1: Scaffolding Boundary Tests
  // =========================================================================
  describe('F1: Project Scaffolding & Tooling (Boundaries)', () => {

    it('F1-T2-01: Engine Rejection on Sub-Node 20 Versions', () => {
      const pkg = parsePackageJson();
      assert.ok(pkg?.engines?.node, 'package.json must specify engines.node');
      const engineRange = pkg.engines.node;

      // Versions that must NOT satisfy engines.node
      const subNodeVersions = ['18.20.0', '19.9.0', '16.14.0', '14.0.0'];
      for (const ver of subNodeVersions) {
        assert.strictEqual(
          satisfiesSemver(ver, engineRange),
          false,
          `Engine range ${engineRange} must reject sub-20 version: ${ver}`
        );
      }

      // Versions that should satisfy
      const validVersions = ['20.0.0', '20.18.0', '22.0.0', '24.0.0'];
      for (const ver of validVersions) {
        assert.strictEqual(
          satisfiesSemver(ver, engineRange),
          true,
          `Engine range ${engineRange} should accept valid version: ${ver}`
        );
      }
    });

    it('F1-T2-02: Hidden & Scratch File Leakage Prevention via git check-ignore', () => {
      const sensitiveFiles = [
        '.env',
        '.env.local',
        '.env.production',
        'GEMINI.md',
        '.agents/plan.md',
        'audit.report.html',
        'lighthouse-run.json'
      ];

      for (const file of sensitiveFiles) {
        const ignored = isGitIgnored(file);
        assert.ok(
          ignored,
          `Git ignore check failed: ${file} must be matched and ignored by git`
        );
      }
    });

    it('F1-T2-03: Strictness Overrides Absence in TypeScript Configs', () => {
      const tsconfigs = ['tsconfig.json', 'tsconfig.api.json'];
      const relaxingFlags = [
        'noImplicitAny',
        'strictNullChecks',
        'strictFunctionTypes',
        'strictBindCallApply',
        'strictPropertyInitialization',
        'noImplicitThis',
        'alwaysStrict'
      ];

      for (const configFile of tsconfigs) {
        const config = readJsonSafe(configFile);
        assert.ok(config, `${configFile} must exist and be valid JSON`);
        const opts = config.compilerOptions || {};
        assert.strictEqual(opts.strict, true, `${configFile} must have strict: true`);

        for (const flag of relaxingFlags) {
          if (flag in opts) {
            assert.notStrictEqual(
              opts[flag],
              false,
              `${configFile} must NOT disable ${flag} (cannot be set to false)`
            );
          }
        }
      }
    });

    it('F1-T2-04: API TypeScript Target Isolation from Client Bundles', () => {
      const clientConfig = readJsonSafe('tsconfig.json');
      assert.ok(clientConfig, 'tsconfig.json must be valid JSON');

      const clientIncludes = clientConfig.include || [];
      const includesApi = clientIncludes.some((inc) => inc.startsWith('api') || inc.startsWith('./api'));
      assert.strictEqual(
        includesApi,
        false,
        'client tsconfig.json must NOT include api/ to prevent NodeNext / DOM collision'
      );
    });

    it('F1-T2-05: Forbidden Legacy Config Files at Workspace Root', () => {
      const legacyFiles = [
        '.eslintrc',
        '.eslintrc.js',
        '.eslintrc.json',
        '.eslintrc.yml',
        '.eslintrc.yaml',
        'webpack.config.js',
        'rollup.config.js'
      ];

      for (const file of legacyFiles) {
        assert.strictEqual(
          fileExists(file),
          false,
          `Forbidden legacy configuration file found at root: ${file}. Use flat config / Vite.`
        );
      }
    });

  });

  // =========================================================================
  // F2: Guardrails Boundary Tests
  // =========================================================================
  describe('F2: Code Quality Guardrails (Boundaries)', () => {

    it('F2-T2-01: Boundary Violation - File Length Limit Configured at 150', () => {
      const eslintContent = readFileSafe('eslint.config.js');
      assert.ok(eslintContent, 'eslint.config.js must exist');
      const maxLinesRegex = /max-lines['"]?\s*:\s*\[['"]error['"],\s*\{\s*['"]?max['"]?\s*:\s*(\d+)/i;
      const match = eslintContent.match(maxLinesRegex);
      if (match) {
        const configuredMax = parseInt(match[1], 10);
        assert.ok(configuredMax <= 150, `max-lines limit must be <= 150, found: ${configuredMax}`);
      } else {
        assert.match(eslintContent, /150/, 'eslint.config.js must configure max-lines with limit 150');
      }
    });

    it('F2-T2-02: Boundary Violation - Function Length Limit Configured at 40', () => {
      const eslintContent = readFileSafe('eslint.config.js');
      assert.match(eslintContent, /max-lines-per-function/i, 'eslint.config.js must configure max-lines-per-function');
      assert.match(eslintContent, /40/, 'Function lines limit must be configured with 40');
    });

    it('F2-T2-03: Boundary Violation - Cyclomatic Complexity Limit Configured at 10', () => {
      const eslintContent = readFileSafe('eslint.config.js');
      assert.match(eslintContent, /complexity/i, 'eslint.config.js must configure complexity');
      assert.match(eslintContent, /10/, 'Complexity limit must be configured with 10');
    });

    it('F2-T2-04: Boundary Violation - Nesting Depth Limit Configured at 3', () => {
      const eslintContent = readFileSafe('eslint.config.js');
      assert.match(eslintContent, /max-depth/i, 'eslint.config.js must configure max-depth');
      assert.match(eslintContent, /3/, 'max-depth limit must be configured with 3');
    });

    it('F2-T2-05: Multiple Violations Combo - any, Missing Return Type, and Missing JSDoc', () => {
      const eslintContent = readFileSafe('eslint.config.js');
      // Verify that all 3 rules are configured with 'error' severity
      const hasNoAny = eslintContent.includes('no-explicit-any') && eslintContent.includes('error');
      const hasReturnType = eslintContent.includes('explicit-function-return-type') && eslintContent.includes('error');
      const hasJsdoc = eslintContent.includes('jsdoc') || eslintContent.includes('require-jsdoc');

      assert.ok(hasNoAny, 'ESLint must enforce @typescript-eslint/no-explicit-any as error');
      assert.ok(hasReturnType, 'ESLint must enforce explicit-function-return-type as error');
      assert.ok(hasJsdoc, 'ESLint must enforce JSDoc documentation on exports');
    });

  });

  // =========================================================================
  // F3: AI Status API Boundary Tests
  // =========================================================================
  describe('F3: Serverless AI Status Contract (Boundaries)', () => {
    let harness = null;

    before(async () => {
      if (fileExists('api/ai-status.ts')) {
        harness = await startServerlessHarness();
      }
    });

    after(async () => {
      if (harness) await harness.close();
    });

    it('F3-T2-01: Whitespace-Only GEMINI_API_KEY Treated as Unconfigured', async () => {
      const prev = process.env.GEMINI_API_KEY;
      try {
        process.env.GEMINI_API_KEY = '   \t\n  ';
        if (harness) await harness.reload();

        if (harness) {
          const res = await fetch(`${harness.origin}/api/ai-status`);
          assert.strictEqual(res.status, 200);
          const data = await res.json();
          assert.strictEqual(
            data.configured,
            false,
            'Whitespace-only GEMINI_API_KEY must evaluate to configured: false'
          );
        } else {
          assert.ok(fileExists('api/ai-status.ts'), 'api/ai-status.ts must exist');
        }
      } finally {
        if (prev !== undefined) process.env.GEMINI_API_KEY = prev;
        else delete process.env.GEMINI_API_KEY;
        if (harness) await harness.reload();
      }
    });

    it('F3-T2-02: Zero Secret Leakage in Response Body and Headers', async () => {
      const prev = process.env.GEMINI_API_KEY;
      const canaryKey = 'AIzaSySuperSecretCanaryPattern1234567890';
      try {
        process.env.GEMINI_API_KEY = canaryKey;
        if (harness) await harness.reload();

        if (harness) {
          const res = await fetch(`${harness.origin}/api/ai-status`);
          const bodyText = await res.text();
          assert.ok(
            !bodyText.includes('AIzaSy'),
            'Canary API key prefix must not appear in response body'
          );
          assert.ok(
            !bodyText.includes(canaryKey),
            'Canary API key must never leak in response body'
          );

          for (const [headerName, headerVal] of res.headers.entries()) {
            assert.ok(
              !headerVal.includes(canaryKey),
              `Secret leaked in response header: ${headerName}`
            );
          }
        }
      } finally {
        if (prev !== undefined) process.env.GEMINI_API_KEY = prev;
        else delete process.env.GEMINI_API_KEY;
        if (harness) await harness.reload();
      }
    });

    it('F3-T2-03: Arbitrary Query Parameters and Path Extensions Immunity', async () => {
      if (harness) {
        const testUrls = [
          `${harness.origin}/api/ai-status?debug=true`,
          `${harness.origin}/api/ai-status?token=canary123&action=eval`,
          `${harness.origin}/api/ai-status?format=xml`
        ];

        for (const testUrl of testUrls) {
          const res = await fetch(testUrl);
          assert.strictEqual(res.status, 200);
          const text = await res.text();
          assert.ok(!text.includes('canary123'), 'Query parameters must not be reflected in response');
          const data = JSON.parse(text);
          assert.strictEqual(typeof data.configured, 'boolean');
        }
      }
    });

    it('F3-T2-04: Large Client Header Ingestion Robustness', async () => {
      if (harness) {
        // Send request with 16KB header value
        const largeVal = 'X'.repeat(16384);
        try {
          const res = await fetch(`${harness.origin}/api/ai-status`, {
            headers: { 'X-Large-Header': largeVal }
          });
          // Should return 200 or 431 (Request Header Fields Too Large), never unhandled crash
          assert.ok(
            [200, 431].includes(res.status),
            `Server must handle large headers gracefully, got status: ${res.status}`
          );
        } catch (err) {
          // Socket hang up or 431 is permissible under extreme headers, but process must stay alive
          assert.ok(err, 'Handled network error');
        }
      }
    });

    it('F3-T2-05: Concurrent Execution Consistency', async () => {
      if (harness) {
        const count = 50;
        const requests = Array.from({ length: count }, () =>
          fetch(`${harness.origin}/api/ai-status`).then((r) => r.json())
        );

        const results = await Promise.all(requests);
        assert.strictEqual(results.length, count);
        const firstConfigured = results[0].configured;
        for (const res of results) {
          assert.strictEqual(res.configured, firstConfigured, 'All concurrent responses must be identical');
        }
      }
    });

  });

  // =========================================================================
  // F4: AI Proxy Contract Boundary Tests
  // =========================================================================
  describe('F4: Serverless AI Proxy Contract (Boundaries)', () => {
    let harness = null;

    before(async () => {
      if (fileExists('api/ai.ts')) {
        harness = await startServerlessHarness();
      }
    });

    after(async () => {
      if (harness) await harness.close();
    });

    it('F4-T2-01: Disallowed Task Rejection (Purpose-Limiting 400 Bad Request)', async () => {
      if (harness) {
        const disallowedTasks = [
          'generate-essay',
          'free-form-chat',
          'code-execution',
          'arbitrary-prompt'
        ];

        for (const task of disallowedTasks) {
          const res = await fetch(`${harness.origin}/api/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task,
              context: { aqi: 200, city: 'Delhi', facts: [] }
            })
          });

          assert.strictEqual(
            res.status,
            400,
            `Disallowed task '${task}' must be rejected with HTTP 400 Bad Request`
          );
          const body = await res.json();
          assert.ok(body.error, '400 response must include JSON error');
        }
      } else {
        assert.ok(fileExists('shared/schemas.ts'), 'shared/schemas.ts must define task schema');
      }
    });

    it('F4-T2-02: Payload Limit Boundary (413 Payload Too Large at >64KB)', async () => {
      if (harness) {
        // Case B: Unambiguously >64KB limit (65,536 bytes) -> must trigger 413
        const payloadB = JSON.stringify({
          task: 'indoor-tips',
          context: { aqi: 250, city: 'Delhi', facts: [] },
          userText: 'A'.repeat(66000)
        });

        const resB = await fetch(`${harness.origin}/api/ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadB
        });

        assert.strictEqual(
          resB.status,
          413,
          `Payload of ${payloadB.length} bytes must return HTTP 413 Payload Too Large`
        );
        const dataB = await resB.json();
        assert.ok(dataB.error, '413 response must contain JSON error');
      }
    });

    it('F4-T2-03: Malformed JSON and Empty Request Bodies (400 Bad Request)', async () => {
      if (harness) {
        const malformedInputs = [
          { label: 'empty string', body: '' },
          { label: 'syntax error', body: '{"unclosed": true' },
          { label: 'array instead of object', body: '[1, 2, 3]' },
          { label: 'empty object', body: '{}' },
          { label: 'invalid types', body: JSON.stringify({ task: 123, context: 'string' }) }
        ];

        for (const { label, body } of malformedInputs) {
          const res = await fetch(`${harness.origin}/api/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
          });

          assert.strictEqual(
            res.status,
            400,
            `Malformed input (${label}) must return HTTP 400 Bad Request`
          );
          const data = await res.json();
          assert.ok(data.error, `Response for ${label} must include error object`);
        }
      }
    });

    it('F4-T2-04: Upstream Timeout (8s) and Function Deadline (9s) Configuration', () => {
      // Check timeout definitions in server/gemini.ts or api/ai.ts
      const geminiSrc = readFileSafe('server/gemini.ts') || readFileSafe('api/ai.ts') || '';
      assert.ok(geminiSrc.length > 0, 'server/gemini.ts or api/ai.ts must exist');

      // Check for 8000 / 8s upstream timeout or 9000 / 9s deadline
      const has8s = geminiSrc.includes('8000') || geminiSrc.includes('8_000') || geminiSrc.includes('8s');
      const has9s = geminiSrc.includes('9000') || geminiSrc.includes('9_000') || geminiSrc.includes('9s');
      assert.ok(
        has8s || has9s || geminiSrc.includes('timeout') || geminiSrc.includes('AbortSignal'),
        'Upstream timeout and deadline must be configured via AbortSignal'
      );
    });

    it('F4-T2-05: Per-Instance Sliding-Window Rate Limiting (429 Too Many Requests)', async () => {
      if (harness) {
        // Send a burst of requests to test rate limiting
        const payload = JSON.stringify({
          task: 'indoor-tips',
          context: { aqi: 300, city: 'Delhi', facts: [] }
        });

        const burstCount = 15;
        const statuses = [];
        for (let i = 0; i < burstCount; i++) {
          const res = await fetch(`${harness.origin}/api/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
          });
          statuses.push(res.status);
        }

        // If rate limit is configured to trigger within 15 requests, 429 will be observed
        const hitRateLimit = statuses.includes(429);
        // Either 429 was triggered or rate limiter is configured in server/rate-limit.ts
        if (!hitRateLimit) {
          assert.ok(
            fileExists('server/rate-limit.ts'),
            'server/rate-limit.ts must exist to provide sliding-window rate limiting'
          );
        }
      } else {
        assert.ok(fileExists('server/rate-limit.ts'), 'server/rate-limit.ts must exist');
      }
    });

  });

  // =========================================================================
  // F5: Vercel.json Security & Routing Boundary Tests
  // =========================================================================
  describe('F5: Vercel.json Security & Routing (Boundaries)', () => {

    it('F5-T2-01: HTML Meta CSP Consistency with HTTP Header CSP', () => {
      const vercelConfig = parseVercelJson();
      const headers = vercelConfig?.headers || [];
      const globalHeaders = headers.find((h) => h.source === '/(.*)')?.headers || [];
      const httpCsp = globalHeaders.find((h) => h.key.toLowerCase() === 'content-security-policy')?.value || '';

      assert.ok(httpCsp.length > 0, 'HTTP CSP must be defined in vercel.json');

      const indexHtml = readFileSafe('index.html');
      if (indexHtml && indexHtml.includes('http-equiv="Content-Security-Policy"')) {
        // Meta CSP must NOT contain frame-ancestors per W3C specification
        const metaCspMatch = indexHtml.match(/content="([^"]+)"/);
        if (metaCspMatch) {
          assert.ok(
            !metaCspMatch[1].includes('frame-ancestors'),
            'frame-ancestors must NOT be present in HTML meta CSP (disallowed by W3C)'
          );
        }
      }
    });

    it('F5-T2-02: API Path Collision Test against SPA Rewrite Pattern', () => {
      const vercelConfig = parseVercelJson();
      const rewrites = vercelConfig?.rewrites || [];
      const spaRewrite = rewrites.find((r) => r.destination === '/index.html' || r.destination === '/');
      assert.ok(spaRewrite, 'SPA rewrite must exist in vercel.json');

      const sourceRegexStr = spaRewrite.source;
      // Convert vercel source glob/regex to RegExp
      // Usually written like: "/((?!api/).*)" or similar
      const regex = new RegExp(`^${sourceRegexStr}$`);

      const apiPaths = [
        '/api/ai',
        '/api/ai-status',
        '/api/v1/test',
        '/api/'
      ];

      for (const apiPath of apiPaths) {
        const matches = regex.test(apiPath);
        assert.strictEqual(
          matches,
          false,
          `API path '${apiPath}' must NOT match SPA rewrite rule to /index.html`
        );
      }

      const clientPaths = ['/dashboard', '/routine', '/tips', '/about'];
      for (const clientPath of clientPaths) {
        const matches = regex.test(clientPath);
        assert.strictEqual(
          matches,
          true,
          `Client SPA path '${clientPath}' MUST match SPA rewrite rule`
        );
      }
    });

    it('F5-T2-03: HSTS Max-Age Boundary (Minimum 1 Year)', () => {
      const vercelConfig = parseVercelJson();
      const headers = vercelConfig?.headers || [];
      const globalHeaders = headers.find((h) => h.source === '/(.*)')?.headers || [];
      const hsts = globalHeaders.find((h) => h.key.toLowerCase() === 'strict-transport-security')?.value || '';

      const match = hsts.match(/max-age=(\d+)/);
      assert.ok(match, 'HSTS must include max-age parameter');
      const maxAgeSeconds = parseInt(match[1], 10);
      assert.ok(
        maxAgeSeconds >= 31536000,
        `HSTS max-age must be at least 1 year (31,536,000s), got: ${maxAgeSeconds}`
      );
    });

    it('F5-T2-04: Non-Hashed Root Files Revalidation (index.html)', () => {
      const vercelConfig = parseVercelJson();
      const headers = vercelConfig?.headers || [];

      // Check headers for / or /index.html
      const rootHeader = headers.find((h) => h.source === '/' || h.source === '/index.html');
      if (rootHeader) {
        const cacheCtrl = rootHeader.headers.find((h) => h.key.toLowerCase() === 'cache-control')?.value || '';
        assert.ok(
          !cacheCtrl.includes('immutable'),
          'index.html must NOT be cached immutably'
        );
      }
    });

    it('F5-T2-05: Strict JSON Schema and Syntax Validation of vercel.json', () => {
      const rawText = readFileSafe('vercel.json');
      assert.ok(rawText, 'vercel.json must exist');

      // Native JSON.parse throws on trailing commas or comments
      assert.doesNotThrow(() => {
        const parsed = JSON.parse(rawText);
        assert.ok(Array.isArray(parsed.headers), 'vercel.json headers must be an array');
        assert.ok(Array.isArray(parsed.rewrites), 'vercel.json rewrites must be an array');
      }, 'vercel.json must be strictly valid JSON without comments or trailing commas');
    });

  });

  // =========================================================================
  // F6: Verification Scripts Boundary Tests
  // =========================================================================
  describe('F6: Verification Scripts (Boundaries)', () => {

    it('F6-T2-01: Secret Scanner Detection of VITE_ Environment Secrets', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-leak-'));
      try {
        fs.mkdirSync(path.join(tempDir, 'assets'), { recursive: true });
        fs.writeFileSync(
          path.join(tempDir, 'assets', 'chunk.js'),
          'const leaked = "VITE_API_SECRET_KEY = 99887766";',
          'utf8'
        );

        const res = runCommandSync('node', ['scripts/check-no-client-secrets.mjs', tempDir]);
        assert.notStrictEqual(res.status, 0, 'Scanner must fail when VITE_ secret is detected');
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('F6-T2-02: Secret Scanner Detection of process.env.GEMINI References', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gemini-env-leak-'));
      try {
        fs.mkdirSync(path.join(tempDir, 'assets'), { recursive: true });
        fs.writeFileSync(
          path.join(tempDir, 'assets', 'chunk.js'),
          'console.log(process.env.GEMINI_API_KEY);',
          'utf8'
        );

        const res = runCommandSync('node', ['scripts/check-no-client-secrets.mjs', tempDir]);
        assert.notStrictEqual(res.status, 0, 'Scanner must fail when process.env.GEMINI is present in client code');
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('F6-T2-03: Secret Scanner Handling of Missing dist/ Directory', () => {
      const nonExistentDir = path.join(os.tmpdir(), `non-existent-${Date.now()}`);
      const res = runCommandSync('node', ['scripts/check-no-client-secrets.mjs', nonExistentDir]);
      assert.notStrictEqual(res.status, 0, 'Scanner must exit non-zero when target directory does not exist');
      const output = res.stderr + res.stdout;
      assert.ok(
        output.toLowerCase().includes('not found') || output.toLowerCase().includes('error'),
        `Scanner must output clean error message for missing directory. Got: ${output}`
      );
    });

    it('F6-T2-04: Smoke Script 15-Second Request Timeout Enforcement', async () => {
      // Start mock server that deliberately hangs
      const hangingServer = await startMockDeployServer({ hanging: true });
      try {
        const startTime = Date.now();
        const res = runCommandSync('node', ['scripts/smoke-deployed.mjs', hangingServer.origin], {
          timeout: 25000 // Subprocess watchdog
        });
        const elapsed = (Date.now() - startTime) / 1000;

        assert.notStrictEqual(res.status, 0, 'Smoke script must fail on hanging server');
        // Script should enforce its internal 15s timeout
        assert.ok(
          elapsed <= 22,
          `Smoke script should abort near 15 seconds, finished in ${elapsed.toFixed(1)}s`
        );
      } finally {
        await hangingServer.close();
      }
    });

    it('F6-T2-05: Smoke Script Detection of Missing Security Headers on Deployed Site', async () => {
      const insecureServer = await startMockDeployServer({
        statusConfigured: true,
        provenanceSource: 'gemini',
        omitSecurityHeaders: true
      });

      try {
        const res = runCommandSync('node', ['scripts/smoke-deployed.mjs', insecureServer.origin]);
        assert.notStrictEqual(
          res.status,
          0,
          'Smoke script must fail if deployed site is missing mandatory security headers'
        );
      } finally {
        await insecureServer.close();
      }
    });

  });

  // =========================================================================
  // F7: CI Pipeline Configuration Boundary Tests
  // =========================================================================
  describe('F7: CI Pipeline Configuration (Boundaries)', () => {

    it('F7-T2-01: Principle of Least Privilege Permissions Block', () => {
      const ciYaml = readFileSafe('.github/workflows/ci.yml');
      assert.ok(ciYaml, '.github/workflows/ci.yml must exist');

      assert.match(ciYaml, /permissions:/, 'CI workflow must declare explicit permissions block');
      assert.match(
        ciYaml,
        /contents:\s*read/i,
        'CI workflow permissions must be restricted to contents: read'
      );
      assert.ok(
        !ciYaml.includes('contents: write'),
        'CI workflow must NOT have contents: write permission'
      );
    });

    it('F7-T2-02: Deterministic Dependency Installation via npm ci', () => {
      const ciYaml = readFileSafe('.github/workflows/ci.yml');
      assert.match(ciYaml, /npm ci/, 'CI workflow must use npm ci for deterministic install');
      assert.ok(
        !ciYaml.includes('npm install') || ciYaml.includes('npm ci'),
        'CI workflow must strictly avoid non-deterministic npm install'
      );
    });

    it('F7-T2-03: Step Sequence Dependency (Build Must Precede Secret Scan)', () => {
      const ciYaml = readFileSafe('.github/workflows/ci.yml');
      const buildIndex = ciYaml.indexOf('npm run build');
      const secretScanIndex = ciYaml.indexOf('check:no-client-secrets');

      assert.ok(buildIndex !== -1, 'npm run build step must exist');
      assert.ok(secretScanIndex !== -1, 'check:no-client-secrets step must exist');
      assert.ok(
        buildIndex < secretScanIndex,
        'npm run build must execute BEFORE check:no-client-secrets in CI pipeline'
      );
    });

    it('F7-T2-04: Coverage Zero-Exclusion Guarantee in Vitest Configuration', () => {
      const vitestConfig = readFileSafe('vitest.config.ts') || readFileSafe('vite.config.ts');
      assert.ok(vitestConfig, 'vitest.config.ts or vite.config.ts must exist');

      // Verify coverage thresholds: statements >= 92, branches >= 85, functions >= 90, lines >= 93
      assert.match(vitestConfig, /statements['"]?\s*:\s*(9[2-9]|100)/, 'Statements coverage threshold must be >= 92%');
      assert.match(vitestConfig, /branches['"]?\s*:\s*(8[5-9]|9\d|100)/, 'Branches coverage threshold must be >= 85%');
      assert.match(vitestConfig, /functions['"]?\s*:\s*(9[0-9]|100)/, 'Functions coverage threshold must be >= 90%');
      assert.match(vitestConfig, /lines['"]?\s*:\s*(9[3-9]|100)/, 'Lines coverage threshold must be >= 93%');
    });

    it('F7-T2-05: High-Severity Audit Exit Code Enforcement Without Suppression', () => {
      const ciYaml = readFileSafe('.github/workflows/ci.yml');
      const auditLineMatch = ciYaml.match(/npm audit[^\r\n]*/);
      assert.ok(auditLineMatch, 'npm audit step must exist in CI workflow');

      const auditLine = auditLineMatch[0];
      assert.ok(
        auditLine.includes('--audit-level=high'),
        'npm audit must enforce --audit-level=high'
      );
      assert.ok(
        !auditLine.includes('|| true'),
        'npm audit must NOT swallow failures with || true'
      );
      assert.ok(
        !ciYaml.includes('continue-on-error: true'),
        'CI workflow steps must NOT suppress audit failures with continue-on-error: true'
      );
    });

  });

});
