import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.js'],
      exclude: ['src/**/*.test.js', 'src/app.js'],
      thresholds: {
        branches: 94,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
