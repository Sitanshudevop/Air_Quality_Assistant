// Secret scanner verifying client distribution bundle contains zero secrets.
import fs from 'node:fs';
import path from 'node:path';

/** Patterns indicating prohibited secrets or server-only env references. */
export const FORBIDDEN_PATTERNS = [
  /AIza[0-9A-Za-z-_]{35}/,
  /AQ\.[0-9A-Za-z-_]+/,
  /GEMINI_API_KEY/,
  /process\.env\.GEMINI/,
  /VITE_.*(?:KEY|SECRET|TOKEN|PASSWORD)/i,
];

/**
 * Recursively scans directory for forbidden secret patterns.
 *
 * @param dirPath - Directory path to scan.
 * @returns Array of detected leak descriptions.
 */
export function scanDirectory(dirPath) {
  const leaks = [];
  if (!fs.existsSync(dirPath)) {
    return [`Target directory does not exist / not found: ${dirPath}`];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      leaks.push(...scanDirectory(fullPath));
    } else if (/\.(js|css|html|map)$/i.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          leaks.push(`Detected pattern ${pattern} in ${fullPath}`);
        }
      }
    }
  }
  return leaks;
}

/** CLI entry point when executed directly. */
export function runSecretCheck() {
  const targetDir = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(process.cwd(), 'dist');

  const leaks = scanDirectory(targetDir);
  if (leaks.length > 0) {
    console.error('Secret check error: target issues or leaks detected:');
    leaks.forEach((leak) => console.error(`  - ${leak}`));
    process.exit(1);
  }
  console.log(`Secret check passed: zero client secrets found in ${targetDir}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename ?? '')) {
  runSecretCheck();
}
