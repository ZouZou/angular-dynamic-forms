import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.spec.ts',
        '**/*.visual.spec.ts',
        '**/*.performance.spec.ts',
        '**/e2e/**',
        '**/*.config.ts',
        '**/*.config.js',
        '**/main.ts',
        '**/polyfills.ts',
        '**/environments/**',
        '**/*.d.ts',
        '**/demo/**',
        '**/form-builder/**', // Exclude form builder (UI demo)
      ],
      include: [
        'src/app/dq-dynamic-form/**/*.ts',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        autoUpdate: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
