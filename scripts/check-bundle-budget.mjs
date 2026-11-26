// Bundle budget gate verifying initial JS gzip size stays within 150 KB.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

/** Default initial JS gzip budget in bytes (150 KB). */
export const DEFAULT_MAX_INITIAL_JS_GZIP_BYTES = 150 * 1024;

function readAttr(attrs, name) {
  const re = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\\x60]+))`,
    'i'
  );
  const match = attrs.match(re);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function normalizeLocalJsPath(rawPath) {
  if (!rawPath || /^https?:\/\//i.test(rawPath) || rawPath.startsWith('//')) {
    return null;
  }
  const clean = rawPath.split(/[?#]/)[0].replace(/^(?:\.\/|\/)+/, '');
  if (!/\.(js|mjs)$/i.test(clean)) return null;
  return clean;
}

/**
 * Extracts deduplicated local module/modulepreload JS paths from HTML.
 *
 * @param html - Contents of dist/index.html.
 * @returns Deduplicated relative asset paths.
 */
export function extractInitialScriptPaths(html) {
  const found = new Set();
  const scriptRe = /<script\b([^>]*)>/gi;
  for (const match of html.matchAll(scriptRe)) {
    const attrs = match[1];
    if ((readAttr(attrs, 'type') ?? '').toLowerCase() !== 'module') continue;
    const src = normalizeLocalJsPath(readAttr(attrs, 'src'));
    if (src) found.add(src);
  }
  const linkRe = /<link\b([^>]*)>/gi;
  for (const match of html.matchAll(linkRe)) {
    const attrs = match[1];
    const relTokens = (readAttr(attrs, 'rel') ?? '').toLowerCase().split(/\s+/);
    if (!relTokens.includes('modulepreload')) continue;
    const href = normalizeLocalJsPath(readAttr(attrs, 'href'));
    if (href) found.add(href);
  }
  return [...found];
}

/**
 * Measures raw and gzipped byte sizes of an asset file.
 *
 * @param filePath - Absolute path to asset file.
 * @returns Raw and gzipped byte counts.
 */
export function measureAssetSizes(filePath) {
  const buf = fs.readFileSync(filePath);
  return { rawBytes: buf.length, gzipBytes: zlib.gzipSync(buf).length };
}

function collectLazyAssets(distDir, initialSet) {
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) return [];
  const entries = fs.readdirSync(assetsDir, { withFileTypes: true });
  const lazy = [];
  for (const entry of entries) {
    if (!entry.isFile() || entry.name.endsWith('.map')) continue;
    if (!/\.(js|mjs)$/i.test(entry.name)) continue;
    const relPath = path.posix.join('assets', entry.name);
    if (initialSet.has(relPath)) continue;
    lazy.push({ path: relPath, ...measureAssetSizes(path.join(assetsDir, entry.name)) });
  }
  return lazy.sort((a, b) => b.gzipBytes - a.gzipBytes);
}

function resolveInitialAssets(distDir, initialPaths, errors) {
  const initialAssets = [];
  const initialSet = new Set();
  const resolvedRoot = path.resolve(distDir) + path.sep;
  for (const relPath of initialPaths) {
    const absPath = path.resolve(distDir, relPath);
    if (!absPath.startsWith(resolvedRoot) || !fs.existsSync(absPath)) {
      errors.push(`Missing referenced initial JS asset: ${relPath}`);
      continue;
    }
    initialSet.add(relPath.replace(/\\/g, '/'));
    initialAssets.push({ path: relPath, ...measureAssetSizes(absPath) });
  }
  return { initialAssets, initialSet };
}

/**
 * Analyzes initial and lazy JS bundle sizes in a build output directory.
 *
 * @param distDir - Path to Vite build output directory.
 * @param budgetBytes - Maximum allowed initial JS gzip bytes.
 * @returns Structured bundle budget analysis report.
 */
export function analyzeBundleBudget(distDir, budgetBytes = DEFAULT_MAX_INITIAL_JS_GZIP_BYTES) {
  const errors = [];
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(distDir)) errors.push(`Build directory not found: ${distDir}`);
  else if (!fs.existsSync(indexHtmlPath)) errors.push(`Entry HTML not found: ${indexHtmlPath}`);
  if (errors.length > 0) {
    return { ok: false, errors, initialAssets: [], lazyAssets: [], totalRawBytes: 0, totalGzipBytes: 0, lazyGzipBytes: 0, budgetBytes };
  }

  const initialPaths = extractInitialScriptPaths(fs.readFileSync(indexHtmlPath, 'utf8'));
  if (initialPaths.length === 0) errors.push('No initial module JS assets found in dist/index.html');

  const { initialAssets, initialSet } = resolveInitialAssets(distDir, initialPaths, errors);
  const lazyAssets = collectLazyAssets(distDir, initialSet);
  const totalRawBytes = initialAssets.reduce((sum, a) => sum + a.rawBytes, 0);
  const totalGzipBytes = initialAssets.reduce((sum, a) => sum + a.gzipBytes, 0);
  const lazyGzipBytes = lazyAssets.reduce((sum, a) => sum + a.gzipBytes, 0);
  if (totalGzipBytes > budgetBytes) {
    errors.push(`Initial JS gzip size (${formatKb(totalGzipBytes)}) exceeds budget (${formatKb(budgetBytes)})`);
  }

  return { ok: errors.length === 0, errors, initialAssets, lazyAssets, totalRawBytes, totalGzipBytes, lazyGzipBytes, budgetBytes };
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

/**
 * Formats a human-readable bundle budget breakdown for CI logs.
 *
 * @param report - Result from analyzeBundleBudget.
 * @returns Multi-line formatted summary string.
 */
export function formatBundleReport(report) {
  const lines = ['Initial JS Bundle Budget Report:'];
  for (const asset of report.initialAssets) {
    lines.push(
      `  - ${asset.path}: raw ${formatKb(asset.rawBytes)} | gzip ${formatKb(asset.gzipBytes)}`
    );
  }
  lines.push(
    `Total initial JS: raw ${formatKb(report.totalRawBytes)} | gzip ${formatKb(report.totalGzipBytes)} / ${formatKb(report.budgetBytes)} budget`
  );
  lines.push(
    `Lazy JS chunks (${report.lazyAssets.length}): gzip ${formatKb(report.lazyGzipBytes)}`
  );
  return lines.join('\n');
}

/** CLI entry point verifying initial JS bundle budget against dist/. */
export function runBundleBudgetCheck() {
  const targetDir = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(process.cwd(), 'dist');

  const report = analyzeBundleBudget(targetDir);
  console.log(formatBundleReport(report));
  if (!report.ok) {
    console.error('Bundle budget check failed:');
    report.errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }
  console.log('Bundle budget check passed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename ?? '')) {
  runBundleBudgetCheck();
}
