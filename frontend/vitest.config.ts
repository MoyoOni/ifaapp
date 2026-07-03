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
      reporter: ['text', 'json', 'html'],
      lines: 80,
      statements: 80,
      include: [
        'src/pages/**/*.{ts,tsx}',
        'src/features/consultations/**/*.{ts,tsx}',
        'src/features/marketplace/cart-view.tsx',
        'src/features/marketplace/checkout-view.tsx',
        'src/features/client-hub/client-dashboard-view.tsx',
        'src/lib/**/*.ts',
      ],
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
