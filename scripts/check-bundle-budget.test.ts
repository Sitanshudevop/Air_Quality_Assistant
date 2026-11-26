// Unit tests for initial JS bundle budget gate script.
import { describe, it, expect, afterEach } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  DEFAULT_MAX_INITIAL_JS_GZIP_BYTES,
  analyzeBundleBudget,
  extractInitialScriptPaths,
  formatBundleReport,
} from './check-bundle-budget.mjs';

describe('Bundle Budget Gate', () => {
  const createdDirs: string[] = [];

  function makeTempDist(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saans-bundle-'));
    createdDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    while (createdDirs.length > 0) {
      const dir = createdDirs.pop();
      if (dir && fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('extracts deduplicated local module and modulepreload JS paths regardless of attribute order', () => {
    const html = `
      <script crossorigin src="/assets/index-123.js?v=1" type="module"></script>
      <link href='/assets/vendor-456.js' rel="modulepreload" crossorigin>
      <link rel="modulepreload" href="/assets/vendor-456.js">
      <link rel="stylesheet" href="/assets/index-123.css">
      <script type="module" src="https://cdn.example.com/ext.js"></script>
    `;
    expect(extractInitialScriptPaths(html)).toEqual([
      'assets/index-123.js',
      'assets/vendor-456.js',
    ]);
  });

  it('passes when initial JS gzip is within budget and excludes lazy chunks from initial total', () => {
    const distDir = makeTempDist();
    fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });
    fs.writeFileSync(
      path.join(distDir, 'index.html'),
      '<script type="module" src="/assets/index.js"></script><link rel="modulepreload" href="/assets/vendor.js">'
    );
    fs.writeFileSync(path.join(distDir, 'assets', 'index.js'), 'console.log("entry");');
    fs.writeFileSync(path.join(distDir, 'assets', 'vendor.js'), 'export const v = 1;');
    fs.writeFileSync(path.join(distDir, 'assets', 'lazy-chart.js'), crypto.randomBytes(200 * 1024));
    fs.writeFileSync(path.join(distDir, 'assets', 'index.js.map'), '{}');

    const report = analyzeBundleBudget(distDir, DEFAULT_MAX_INITIAL_JS_GZIP_BYTES);
    expect(report.ok).toBe(true);
    expect(report.initialAssets).toHaveLength(2);
    expect(report.lazyAssets).toHaveLength(1);
    expect(report.totalGzipBytes).toBeLessThanOrEqual(DEFAULT_MAX_INITIAL_JS_GZIP_BYTES);

    const formatted = formatBundleReport(report);
    expect(formatted).toContain('assets/index.js');
    expect(formatted).toContain('150.00 KB budget');
    expect(formatted).toContain('Lazy JS chunks (1)');
  });

  it('fails when initial JS gzip exceeds budget', () => {
    const distDir = makeTempDist();
    fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });
    fs.writeFileSync(
      path.join(distDir, 'index.html'),
      '<script type="module" src="/assets/huge.js"></script>'
    );
    fs.writeFileSync(path.join(distDir, 'assets', 'huge.js'), crypto.randomBytes(170 * 1024));

    const report = analyzeBundleBudget(distDir);
    expect(report.ok).toBe(false);
    expect(report.errors[0]).toContain('exceeds budget');
  });

  it('fails cleanly when dist/, index.html, initial scripts, or referenced assets are missing', () => {
    const missingDir = path.join(os.tmpdir(), `saans-missing-${Date.now()}`);
    expect(analyzeBundleBudget(missingDir).ok).toBe(false);

    const noHtmlDir = makeTempDist();
    expect(analyzeBundleBudget(noHtmlDir).errors[0]).toContain('Entry HTML not found');

    const emptyHtmlDir = makeTempDist();
    fs.writeFileSync(path.join(emptyHtmlDir, 'index.html'), '<html><body></body></html>');
    expect(analyzeBundleBudget(emptyHtmlDir).errors[0]).toContain('No initial module JS assets');

    const missingChunkDir = makeTempDist();
    fs.writeFileSync(
      path.join(missingChunkDir, 'index.html'),
      '<script type="module" src="/assets/missing.js"></script>'
    );
    const chunkReport = analyzeBundleBudget(missingChunkDir);
    expect(chunkReport.ok).toBe(false);
    expect(chunkReport.errors[0]).toContain('Missing referenced initial JS asset');
  });

  it('deduplicates ./assets and /assets paths with query strings without lazy misclassification or double-counting', () => {
    const distDir = makeTempDist();
    fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });
    fs.writeFileSync(
      path.join(distDir, 'index.html'),
      [
        '<script type="module" src="./assets/index.js"></script>',
        '<script type="module" src="./assets/vendor.js?t=999"></script>',
        '<link rel="modulepreload" href="/assets/vendor.js">',
      ].join('')
    );
    const indexBytes = Buffer.from('console.log("entry");');
    const vendorBytes = Buffer.alloc(10000, 'a');
    fs.writeFileSync(path.join(distDir, 'assets', 'index.js'), indexBytes);
    fs.writeFileSync(path.join(distDir, 'assets', 'vendor.js'), vendorBytes);

    const report = analyzeBundleBudget(distDir, DEFAULT_MAX_INITIAL_JS_GZIP_BYTES);
    expect(report.ok).toBe(true);
    expect(report.initialAssets.map((a) => a.path)).toEqual([
      'assets/index.js',
      'assets/vendor.js',
    ]);
    expect(report.lazyAssets).toEqual([]);
    expect(report.totalRawBytes).toBe(indexBytes.length + vendorBytes.length);
  });

  it('extracts unquoted HTML5 attributes while ignoring hyphen-prefixed attributes like data-rel', () => {
    const html = [
      '<script type=module src=/assets/index.js></script>',
      '<link data-rel="modulepreload" href="/assets/ignored.js">',
      '<link rel=modulepreload href=./assets/vendor.js?v=2>',
    ].join('');
    expect(extractInitialScriptPaths(html)).toEqual([
      'assets/index.js',
      'assets/vendor.js',
    ]);
  });
});
