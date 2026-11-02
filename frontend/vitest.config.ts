import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      // A floor at the real whole-app coverage (November 2, 2026), enforced
      // in CI, so it can only go up. Before this, `lines: 80` sat outside
      // `thresholds` (Vitest ignores it there), only six paths were
      // measured, and CI never ran coverage at all.
      thresholds: { statements: 20, branches: 15, functions: 12, lines: 21 },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/lib/sentry.ts',
        'src/lib/api.ts',
        '**/SpiritualJourneyTestPage*',
        '**/SentryTestPage*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@common': path.resolve(__dirname, '../common/src'),
    },
  },
});
