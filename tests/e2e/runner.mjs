#!/usr/bin/env node
/**
 * Master E2E Test Suite Runner for Saans Milestone M0 Foundation.
 * Executes all 4 test tiers (Tier 1-4) using Node.js native test runner,
 * aggregates results, prints diagnostic tables, and exits with 0 on pass or 1 on failure.
 */
import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { register } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..');

// Register TypeScript NodeNext .js -> .ts resolution hook
if (!globalThis.__tsResolverRegistered) {
  try {
    const resolverUrl = pathToFileURL(path.resolve(__dirname, 'helpers/ts-resolver.mjs')).href;
    register(resolverUrl, pathToFileURL(workspaceRoot + '/').href);
    globalThis.__tsResolverRegistered = true;
  } catch {}
}

const testSuites = [
  { tier: 'Tier 1', name: 'Feature Coverage', file: path.join(__dirname, 'tier1-features.test.mjs') },
  { tier: 'Tier 2', name: 'Boundary & Corner Cases', file: path.join(__dirname, 'tier2-boundary.test.mjs') },
  { tier: 'Tier 3', name: 'Pairwise Combinations', file: path.join(__dirname, 'tier3-combinations.test.mjs') },
  { tier: 'Tier 4', name: 'Real-World Scenarios', file: path.join(__dirname, 'tier4-scenarios.test.mjs') }
];

console.log('='.repeat(72));
console.log('  SAANS (Urban Air Quality Assistant) - Milestone M0 E2E Test Suite');
console.log('  Opaque-Box Requirement Verification Track');
console.log('='.repeat(72));
console.log(`Node Runtime : ${process.version}`);
console.log(`Platform     : ${process.platform} (${process.arch})`);
console.log(`Test Tiers   : Tier 1 (35), Tier 2 (35), Tier 3 (8), Tier 4 (5)`);
console.log('='.repeat(72));
console.log();

let totalPass = 0;
let totalFail = 0;
let totalSkip = 0;
let hasFailure = false;

const startTime = Date.now();

const testStream = run({
  files: testSuites.map((s) => s.file),
  concurrency: 1
});

testStream.on('test:pass', () => {
  totalPass++;
});

testStream.on('test:fail', () => {
  totalFail++;
  hasFailure = true;
});

testStream.on('test:skip', () => {
  totalSkip++;
});

// Stream standard spec reporter to stdout
testStream.compose(new spec()).pipe(process.stdout);

testStream.on('end', () => {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log();
  console.log('='.repeat(72));
  console.log('  E2E TEST SUITE EXECUTION SUMMARY');
  console.log('='.repeat(72));
  console.log(`  Duration : ${duration}s`);
  console.log(`  Passed   : ${totalPass}`);
  console.log(`  Failed   : ${totalFail}`);
  console.log(`  Skipped  : ${totalSkip}`);
  console.log(`  Total    : ${totalPass + totalFail + totalSkip}`);
  console.log('='.repeat(72));

  if (hasFailure || totalFail > 0) {
    console.error('\n❌ E2E Test Suite FAILED: One or more requirement gates were not satisfied.');
    process.exit(1);
  } else {
    console.log('\n✅ E2E Test Suite PASSED: All requirement and boundary gates satisfied.');
    process.exit(0);
  }
});
