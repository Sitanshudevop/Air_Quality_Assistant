// Deployment smoke test script validating deployed URL against acceptance criteria.
const baseUrlArg = process.argv[2];

if (!baseUrlArg) {
  console.error('Usage: node scripts/smoke-deployed.mjs <deployed-url>');
  process.exit(1);
}

const baseUrl = baseUrlArg.replace(/\/+$/, '');

/**
 * Executes HTTP request with timeout.
 *
 * @param url - Destination URL.
 * @param options - Fetch options.
 * @returns Response object.
 */
async function fetchWithTimeout(url, options = {}) {
  const signal = AbortSignal.timeout(15000);
  return fetch(url, { ...options, signal });
}

/** Runs deployed smoke tests suite. */
async function runSmokeTests() {
  console.log(`Starting smoke tests against: ${baseUrl}\n`);
  const checks = [];

  // Check 1: AI Status Endpoint
  try {
    const res = await fetchWithTimeout(`${baseUrl}/api/ai-status`);
    const json = await res.json();
    checks.push({
      name: 'GET /api/ai-status returns 200 with JSON',
      pass: res.status === 200 && typeof json.configured === 'boolean',
    });
  } catch (err) {
    checks.push({ name: 'GET /api/ai-status', pass: false, error: err.message });
  }

  // Check 2: Reject GET on /api/ai
  try {
    const res = await fetchWithTimeout(`${baseUrl}/api/ai`);
    checks.push({
      name: 'GET /api/ai returns 405 Method Not Allowed',
      pass: res.status === 405,
    });
  } catch (err) {
    checks.push({ name: 'GET /api/ai returns 405', pass: false, error: err.message });
  }

  // Check 3: Reject invalid POST body on /api/ai
  try {
    const res = await fetchWithTimeout(`${baseUrl}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: true }),
    });
    checks.push({
      name: 'POST /api/ai with invalid body returns 400',
      pass: res.status === 400,
    });
  } catch (err) {
    checks.push({ name: 'POST /api/ai invalid body', pass: false, error: err.message });
  }

  // Check 4: Valid POST for indoor-tips
  try {
    const res = await fetchWithTimeout(`${baseUrl}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'indoor-tips',
        context: { aqi: 240, city: 'Delhi', facts: ['PM2.5 is high'] },
      }),
    });
    const json = await res.json();
    const prov = json.provenance || {};
    const pass =
      res.status === 200 &&
      prov.source === 'gemini' &&
      typeof prov.model === 'string' &&
      prov.model.length > 0;
    checks.push({
      name: "POST /api/ai valid task returns 200 with source: 'gemini' and model name",
      pass,
    });
  } catch (err) {
    checks.push({ name: 'POST /api/ai valid task', pass: false, error: err.message });
  }

  // Check 5: Security headers on root
  try {
    const res = await fetchWithTimeout(`${baseUrl}/`);
    const csp = res.headers.get('content-security-policy') ?? '';
    const xcto = res.headers.get('x-content-type-options');
    const xfo = res.headers.get('x-frame-options');
    const pass = !csp.includes('unsafe-eval') && xcto === 'nosniff' && xfo === 'DENY';
    checks.push({
      name: 'Root page contains strict security headers (CSP, nosniff, DENY)',
      pass,
    });
  } catch (err) {
    checks.push({ name: 'Security headers on root', pass: false, error: err.message });
  }

  // Summary
  console.log('Smoke Test Results:');
  let allPassed = true;
  for (const c of checks) {
    console.log(`[${c.pass ? 'PASS' : 'FAIL'}] ${c.name}${c.error ? ` (${c.error})` : ''}`);
    if (!c.pass) allPassed = false;
  }

  if (!allPassed) {
    console.error('\nSmoke tests failed!');
    process.exit(1);
  }
  console.log('\nAll smoke tests passed successfully!');
}

runSmokeTests().catch((err) => {
  console.error('Smoke test runner fatal error:', err);
  process.exit(1);
});
