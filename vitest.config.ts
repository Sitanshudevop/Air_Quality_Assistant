// Vitest configuration for Saans test runner and coverage thresholds.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'api/**/*.{test,spec}.ts',
      'server/**/*.{test,spec}.ts',
      'shared/**/*.{test,spec}.ts',
      'scripts/**/*.{test,spec}.ts',
      'tests/*.test.ts',
    ],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        statements: 92,
        branches: 85,
        functions: 90,
        lines: 93,
      },
      include: ['src/**/*.ts', 'src/**/*.tsx', 'api/**/*.ts', 'server/**/*.ts', 'shared/**/*.ts'],
      exclude: ['src/test/**/*', 'src/**/*.d.ts'],
    },
  },
});
