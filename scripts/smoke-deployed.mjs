// Deployment smoke test script validating deployed URL against acceptance criteria.
const args = process.argv.slice(2);
const runPrompts = args.includes('--prompts');
const baseUrlArg = args.find((arg) => !arg.startsWith('-'));

if (!baseUrlArg) {
  console.error('Usage: node scripts/smoke-deployed.mjs <deployed-url> [--prompts]');
  process.exit(1);
}

const baseUrl = baseUrlArg.replace(/\/+$/, '');

const DIVERSE_PROMPTS = [
  {
    label: 'Prompt 1 (narrate-plan Delhi)',
    payload: {
      task: 'narrate-plan',
      context: { aqi: 425, city: 'Delhi', facts: ['AQI: 425', 'PM2.5: 380'] },
      userText: 'Create a safe daily smog routine for Delhi severe morning.',
    },
  },
  {
    label: 'Prompt 2 (indoor-tips Lucknow)',
    payload: {
      task: 'indoor-tips',
      context: { aqi: 350, city: 'Lucknow', facts: ['AQI: 350', 'Room: 180 sq ft'] },
      userText: 'Indoor tips for an asthmatic toddler.',
    },
  },
  {
    label: 'Prompt 3 (explain-impact Patna)',
    payload: {
      task: 'explain-impact',
      context: { aqi: 280, city: 'Patna', facts: ['AQI: 280', 'Exposure change: -65%'] },
      userText: 'Compare metro vs two-wheeler commute exposure.',
    },
  },
  {
    label: 'Prompt 4 (community-message Kanpur)',
    payload: {
      task: 'community-message',
      context: { aqi: 430, city: 'Kanpur', facts: ['AQI: 430', 'Outdoor sports suspended'] },
      userText: 'Draft a short RWA and school notice for severe smog.',
    },
  },
  {
    label: 'Prompt 5 (chat Hindi)',
    payload: {
      task: 'chat',
      context: { aqi: 390, city: 'Delhi', facts: ['AQI: 390'] },
      userText: 'आज दिल्ली में AQI 390 है, घर के अंदर हवा साफ रखने के लिए क्या करें?',
    },
  },
];

/** Extracts flattened non-empty text from a structured AI task result. */
function extractReplyText(value) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(extractReplyText).filter(Boolean).join(' ');
  if (value && typeof value === 'object') {
    return Object.values(value).map(extractReplyText).filter(Boolean).join(' ');
  }
  return '';
}

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

/** Runs 5 diverse live prompt checks asserting non-rule, non-empty, distinct responses. */
async function runDiversePromptChecks(checks) {
  const replies = [];
  for (const item of DIVERSE_PROMPTS) {
    try {
      const res = await fetchWithTimeout(`${baseUrl}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
      const json = await res.json();
      const text = extractReplyText(json.result);
      const isGemini = json.provenance?.source === 'gemini';
      const pass = res.status === 200 && isGemini && text.length > 0;
      if (pass) replies.push(text.toLowerCase());
      checks.push({
        name: `${item.label}: status=${res.status}, source=${json.provenance?.source ?? 'none'}`,
        pass,
      });
    } catch (err) {
      checks.push({ name: item.label, pass: false, error: err.message });
    }
  }
  checks.push({
    name: 'All 5 prompt replies are distinct and non-empty',
    pass: replies.length === DIVERSE_PROMPTS.length && new Set(replies).size === DIVERSE_PROMPTS.length,
  });
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

  if (runPrompts) {
    await runDiversePromptChecks(checks);
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
