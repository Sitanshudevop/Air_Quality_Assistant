/**
 * ESM module resolution hook for Node v24 native TypeScript execution.
 * Allows TypeScript modules using NodeNext (.js extensions in imports)
 * to resolve to their corresponding .ts / .tsx source files.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND' && specifier.endsWith('.js')) {
      // Try resolving with .ts or .tsx
      const tsSpecifier = specifier.slice(0, -3) + '.ts';
      try {
        return await nextResolve(tsSpecifier, context);
      } catch {
        const tsxSpecifier = specifier.slice(0, -3) + '.tsx';
        try {
          return await nextResolve(tsxSpecifier, context);
        } catch {
          // Re-throw original error
        }
      }
    }
    throw err;
  }
}
