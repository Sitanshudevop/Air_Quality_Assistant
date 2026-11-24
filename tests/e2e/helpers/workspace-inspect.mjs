/**
 * Workspace inspection utilities for opaque-box E2E test suite.
 * Evaluates repository files, configurations, git ignore rules, and subprocess execution.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Workspace root is two levels up from tests/e2e/helpers
export const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..');

/**
 * Resolves a path relative to workspace root.
 * @param {string} relPath 
 * @returns {string}
 */
export function resolveWorkspacePath(relPath) {
  return path.resolve(WORKSPACE_ROOT, relPath);
}

/**
 * Safely reads a file from the workspace.
 * @param {string} relPath 
 * @returns {string|null}
 */
export function readFileSafe(relPath) {
  const fullPath = resolveWorkspacePath(relPath);
  try {
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fs.readFileSync(fullPath, 'utf8');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Strips comments from JSON string (supports // and block comments)
 * @param {string} text 
 * @returns {string}
 */
export function stripJsonComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

/**
 * Safely reads and parses a JSON file from the workspace.
 * @param {string} relPath 
 * @returns {any|null}
 */
export function readJsonSafe(relPath) {
  const content = readFileSafe(relPath);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    try {
      return JSON.parse(stripJsonComments(content));
    } catch {
      return null;
    }
  }
}

/**
 * Checks if a file exists in the workspace.
 * @param {string} relPath 
 * @returns {boolean}
 */
export function fileExists(relPath) {
  const fullPath = resolveWorkspacePath(relPath);
  try {
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
  } catch {
    return false;
  }
}

/**
 * Checks if a directory exists in the workspace.
 * @param {string} relPath 
 * @returns {boolean}
 */
export function dirExists(relPath) {
  const fullPath = resolveWorkspacePath(relPath);
  try {
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Reads and parses .nvmrc.
 * @returns {string|null}
 */
export function parseNvmrc() {
  const content = readFileSafe('.nvmrc');
  if (!content) return null;
  return content.trim().replace(/^v/i, '');
}

/**
 * Reads and parses package.json.
 * @returns {any|null}
 */
export function parsePackageJson() {
  return readJsonSafe('package.json');
}

/**
 * Reads and parses vercel.json.
 * @returns {any|null}
 */
export function parseVercelJson() {
  return readJsonSafe('vercel.json');
}

/**
 * Reads .gitignore and returns list of non-empty, non-comment pattern lines.
 * @returns {string[]}
 */
export function parseGitignore() {
  const content = readFileSafe('.gitignore');
  if (!content) return [];
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

/**
 * Checks if a relative path is ignored by git using `git check-ignore`.
 * @param {string} relPath 
 * @returns {boolean}
 */
export function isGitIgnored(relPath) {
  try {
    const res = runCommandSync('git', ['check-ignore', '-q', relPath]);
    return res.status === 0;
  } catch {
    // Fallback: check against patterns in .gitignore
    const patterns = parseGitignore();
    return patterns.some((p) => {
      const clean = p.replace(/^\//, '').replace(/\/$/, '');
      return relPath === clean || relPath.startsWith(clean + '/') || relPath.endsWith(clean);
    });
  }
}

/**
 * Cross-platform subprocess execution helper.
 * On Windows, converts `npm` and `npx` to `.cmd` to avoid PowerShell script security errors.
 * @param {string} command 
 * @param {string[]} args 
 * @param {import('node:child_process').SpawnSyncOptions} options 
 * @returns {{ status: number|null, stdout: string, stderr: string, error: Error|undefined }}
 */
export function runCommandSync(command, args = [], options = {}) {
  let resolvedCmd = command;
  if (process.platform === 'win32') {
    if (command === 'npm') resolvedCmd = 'npm.cmd';
    if (command === 'npx') resolvedCmd = 'npx.cmd';
  }

  const spawnOptions = {
    cwd: WORKSPACE_ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...options
  };

  const result = spawnSync(resolvedCmd, args, spawnOptions);
  return {
    status: result.status,
    stdout: result.stdout ? result.stdout.toString() : '',
    stderr: result.stderr ? result.stderr.toString() : '',
    error: result.error
  };
}

/**
 * Evaluates whether a semantic version satisfies a simple range requirement.
 * Supports: >=X, >=X.Y, >=X.Y.Z, ^X.Y.Z, X, X.Y, X.Y.Z
 * @param {string} versionStr 
 * @param {string} rangeStr 
 * @returns {boolean}
 */
export function satisfiesSemver(versionStr, rangeStr) {
  if (!versionStr || !rangeStr) return false;

  const cleanVersion = versionStr.trim().replace(/^[v^>=<\s]+/, '');
  const vParts = cleanVersion.split('.').map((n) => parseInt(n, 10) || 0);
  const vMajor = vParts[0] || 0;
  const vMinor = vParts[1] || 0;
  const vPatch = vParts[2] || 0;

  const trimmedRange = rangeStr.trim();

  // Range: >=X.Y.Z or >=X
  if (trimmedRange.startsWith('>=')) {
    const rClean = trimmedRange.slice(2).trim();
    const rParts = rClean.split('.').map((n) => parseInt(n, 10) || 0);
    const rMajor = rParts[0] || 0;
    const rMinor = rParts[1] || 0;
    const rPatch = rParts[2] || 0;

    if (vMajor > rMajor) return true;
    if (vMajor < rMajor) return false;
    if (vMinor > rMinor) return true;
    if (vMinor < rMinor) return false;
    return vPatch >= rPatch;
  }

  // Range: ^X.Y.Z
  if (trimmedRange.startsWith('^')) {
    const rClean = trimmedRange.slice(1).trim();
    const rParts = rClean.split('.').map((n) => parseInt(n, 10) || 0);
    const rMajor = rParts[0] || 0;
    if (vMajor !== rMajor) return false;
    if (vMinor > (rParts[1] || 0)) return true;
    if (vMinor < (rParts[1] || 0)) return false;
    return vPatch >= (rParts[2] || 0);
  }

  // Exact major match: e.g. "20", "24"
  const rNum = parseInt(trimmedRange, 10);
  if (!isNaN(rNum) && !trimmedRange.includes('.')) {
    return vMajor === rNum;
  }

  return vMajor >= 20;
}
