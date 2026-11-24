/**
 * Tier 4: Real-World Application Scenario E2E Tests (5 Tests)
 * End-to-end multi-step user, operator, and security workflows simulating
 * real-world production usage and evaluation scenarios.
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

describe('Tier 4: Real-World Application Scenarios', () => {

  // =========================================================================
  // Scenario 4.1: Clean Git Clone / Fresh Setup Verification Scenario
  // =========================================================================
  it('Scenario 4.1: Clean Git Clone / Fresh Setup Verification Scenario', () => {
    // 1. License & Legal hygiene
    assert.ok(fileExists('LICENSE'), 'LICENSE must be present at repository root');
    const license = readFileSafe('LICENSE');
    assert.ok(license.includes('MIT License'), 'LICENSE must be MIT');
    assert.ok(license.includes('2026'), 'LICENSE must be dated 2026');

    // 2. Canonical Directory Structure (13 directories)
    const canonicalDirs = [
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
    for (const dir of canonicalDirs) {
      assert.ok(dirExists(dir), `Canonical directory must exist: ${dir}`);
    }

    // 3. Package Manifest & Script Conformance
    const pkg = parsePackageJson();
    assert.ok(pkg, 'package.json must exist');
    assert.strictEqual(pkg.type, 'module', 'package.json must specify "type": "module"');

    const requiredScripts = [
      'dev',
      'build',
      'lint',
      'test',
      'test:coverage',
      'typecheck',
      'typecheck:api',
      'check:no-client-secrets',
      'smoke:deployed'
    ];
    for (const script of requiredScripts) {
      assert.ok(pkg.scripts?.[script], `package.json scripts must include: ${script}`);
    }

    // 4. Dependencies
    assert.ok(pkg.dependencies?.react, 'react dependency must be listed');
    assert.ok(pkg.dependencies?.['react-dom'], 'react-dom dependency must be listed');
    assert.ok(pkg.dependencies?.zod, 'zod dependency must be listed');

    // 5. Dev Dependencies
    const requiredDevDeps = [
      'typescript',
      'tailwindcss',
      'eslint',
      'vitest',
      '@vitest/coverage-v8',
      '@testing-library/react',
      'knip',
      'jscpd',
      'madge'
    ];
    for (const devDep of requiredDevDeps) {
      assert.ok(pkg.devDependencies?.[devDep], `devDependencies must include: ${devDep}`);
    }
    const hasVite = Boolean(pkg.devDependencies?.vite || pkg.devDependencies?.['@vitejs/plugin-react']);
    assert.ok(hasVite, 'devDependencies must include vite or @vitejs/plugin-react');
  });

  // =========================================================================
  // Scenario 4.2: Severe Smog Season Citizen Query & AI Recommendation Flow
  // =========================================================================
  it('Scenario 4.2: Severe Smog Season Citizen Query & AI Recommendation Flow', async () => {
    let harness = null;
    const prevKey = process.env.GEMINI_API_KEY;

    try {
      process.env.GEMINI_API_KEY = 'AIzaSyMockKeyForCitizenScenario';
      if (fileExists('api/ai.ts') && fileExists('api/ai-status.ts')) {
        harness = await startServerlessHarness();
      }

      if (harness) {
        // Step 1: Health check
        const healthRes = await fetch(`${harness.origin}/api/ai-status`);
        assert.strictEqual(healthRes.status, 200, 'Health check must return 200');
        const healthData = await healthRes.json();
        assert.strictEqual(typeof healthData.configured, 'boolean');

        // Step 2: Severe smog citizen query
        const smogPayload = {
          task: 'indoor-tips',
          context: {
            aqi: 425,
            city: 'New Delhi',
            facts: [
              'PM2.5 is 380 µg/m³ (Severe+)',
              'GRAP Stage IV restrictions in effect',
              'Temperature inversion trapping smoke'
            ]
          },
          userText: 'What immediate indoor routines should we adopt for toddler safety?'
        };

        const adviceRes = await fetch(`${harness.origin}/api/ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(smogPayload)
        });

        // Depending on live Gemini vs offline mock, handle 200 or 503
        if (adviceRes.status === 200) {
          const adviceData = await adviceRes.json();
          assert.strictEqual(adviceData.task, 'indoor-tips');
          assert.ok(adviceData.result, 'Response must include structured recommendations');
          assert.ok(adviceData.provenance, 'Response must include provenance metadata');
          assert.strictEqual(adviceData.provenance.cached, false, 'First query must be a fresh computation');

          // Step 3: Rapid re-query (cache hit verification)
          const cachedRes = await fetch(`${harness.origin}/api/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(smogPayload)
          });
          assert.strictEqual(cachedRes.status, 200);
          const cachedData = await cachedRes.json();
          assert.strictEqual(cachedData.provenance.cached, true, 'Duplicate request within TTL must return cached: true');
        } else {
          assert.ok([200, 503].includes(adviceRes.status));
        }
      } else {
        assert.ok(fileExists('api/ai.ts'), 'api/ai.ts must exist');
        assert.ok(fileExists('api/ai-status.ts'), 'api/ai-status.ts must exist');
      }
    } finally {
      if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
      else delete process.env.GEMINI_API_KEY;
      if (harness) await harness.close();
    }
  });

  // =========================================================================
  // Scenario 4.3: Adversarial Penetration, Fuzzing & Prompt Defense Scenario
  // =========================================================================
  it('Scenario 4.3: Adversarial Penetration, Fuzzing & Prompt Defense Scenario', async () => {
    let harness = null;
    try {
      if (fileExists('api/ai.ts') && fileExists('api/ai-status.ts')) {
        harness = await startServerlessHarness();
      }

      if (harness) {
        // Attack Vector 1: Method Tampering
        const disallowedMethods = ['GET', 'PUT', 'DELETE', 'PATCH'];
        for (const method of disallowedMethods) {
          const res = await fetch(`${harness.origin}/api/ai`, { method });
          assert.strictEqual(
            res.status,
            405,
            `Method tampering with ${method} on /api/ai must be rejected with 405`
          );
        }

        // Attack Vector 2: Buffer Bloat & Payload Exhaustion (>64KB)
        const hugeJunk = JSON.stringify({
          task: 'indoor-tips',
          context: { aqi: 100, city: 'Delhi', facts: [] },
          userText: 'A'.repeat(80000) // 80KB > 64KB
        });
        const bloatRes = await fetch(`${harness.origin}/api/ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: hugeJunk
        });
        assert.strictEqual(
          bloatRes.status,
          413,
          'Oversized payload must be rejected with HTTP 413 Payload Too Large'
        );

        // Attack Vector 3: Task Smuggling & Schema Corruption
        const smuggledRes = await fetch(`${harness.origin}/api/ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: 'execute-shell-command',
            command: 'rm -rf /',
            context: 'invalid'
          })
        });
        assert.strictEqual(
          smuggledRes.status,
          400,
          'Unapproved task smuggling must be rejected with HTTP 400 Bad Request'
        );
      }

      // Attack Vector 4: Clickjacking & Security Headers Defense (vercel.json)
      const vercelConfig = parseVercelJson();
      assert.ok(vercelConfig, 'vercel.json must exist');
      const headers = vercelConfig.headers?.find((h) => h.source === '/(.*)')?.headers || [];
      const xfo = headers.find((h) => h.key.toLowerCase() === 'x-frame-options')?.value;
      assert.strictEqual(xfo, 'DENY', 'Clickjacking defense: X-Frame-Options must be DENY');

      const xcto = headers.find((h) => h.key.toLowerCase() === 'x-content-type-options')?.value;
      assert.strictEqual(xcto, 'nosniff', 'MIME sniffing defense: X-Content-Type-Options must be nosniff');
    } finally {
      if (harness) await harness.close();
    }
  });

  // =========================================================================
  // Scenario 4.4: Full Deployment Smoke Verification Simulation
  // =========================================================================
  it('Scenario 4.4: Full Deployment Smoke Verification Simulation', async () => {
    assert.ok(
      fileExists('scripts/smoke-deployed.mjs'),
      'scripts/smoke-deployed.mjs must exist'
    );

    // 1. Deploy compliant mock server
    const mockServer = await startMockDeployServer({
      statusConfigured: true,
      provenanceSource: 'gemini'
    });

    try {
      // 2. Execute smoke-deployed against compliant server
      const passResult = runCommandSync('node', ['scripts/smoke-deployed.mjs', mockServer.origin]);
      assert.strictEqual(
        passResult.status,
        0,
        `Smoke test should exit 0 on compliant deployed server. Output: ${passResult.stdout} ${passResult.stderr}`
      );
      assert.ok(
        passResult.stdout.includes('200') || passResult.stdout.includes('pass') || passResult.stdout.includes('ok'),
        'Smoke test output should summarize passing checks'
      );
    } finally {
      await mockServer.close();
    }

    // 3. Negative test against missing security headers
    const badServer = await startMockDeployServer({
      statusConfigured: true,
      provenanceSource: 'gemini',
      omitSecurityHeaders: true
    });

    try {
      const failResult = runCommandSync('node', ['scripts/smoke-deployed.mjs', badServer.origin]);
      assert.notStrictEqual(
        failResult.status,
        0,
        'Smoke test must fail when deployed host is missing required security headers'
      );
    } finally {
      await badServer.close();
    }
  });

  // =========================================================================
  // Scenario 4.5: CI Pipeline Pre-Flight Verification Simulation
  // =========================================================================
  it('Scenario 4.5: CI Pipeline Pre-Flight Verification Simulation', () => {
    // Stage 1: GitHub Actions Configuration Verification
    assert.ok(fileExists('.github/workflows/ci.yml'), '.github/workflows/ci.yml must exist');
    const ciYaml = readFileSafe('.github/workflows/ci.yml');

    assert.match(ciYaml, /ubuntu-latest/, 'CI runner must use ubuntu-latest');
    assert.match(ciYaml, /\.nvmrc/, 'CI must read Node version from .nvmrc');
    assert.match(ciYaml, /npm ci/, 'CI must install dependencies with npm ci');

    // Stage 2: Dual TypeScript Configurations
    assert.ok(fileExists('tsconfig.json'), 'tsconfig.json must exist');
    assert.ok(fileExists('tsconfig.api.json'), 'tsconfig.api.json must exist');

    // Stage 3: Vitest Coverage Thresholds
    const vitestConfig = readFileSafe('vitest.config.ts') || readFileSafe('vite.config.ts');
    assert.ok(vitestConfig, 'vitest configuration must exist');
    assert.match(vitestConfig, /coverage/, 'Coverage reporting must be enabled');

    // Stage 4: Post-Build Secret Scanner Script
    assert.ok(fileExists('scripts/check-no-client-secrets.mjs'), 'Secret scanner script must exist');

    // Stage 5: Security Audit Gate
    assert.match(ciYaml, /npm audit --audit-level=high/, 'npm audit --audit-level=high must be configured');
  });

});
