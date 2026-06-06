import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    exclude: ['tests/integration/**'],
    // Coverage reports 0 files until src/ has application code — expected for the template.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', '**/*.test.ts', '**/*.spec.ts', 'tests/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  projects: [
    {
      test: {
        name: 'unit',
        globals: true,
        environment: 'node',
        include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.spec.ts'],
      },
    },
    {
      test: {
        name: 'integration',
        globals: true,
        environment: 'node',
        include: ['tests/integration/**/*.test.ts', 'tests/integration/**/*.spec.ts'],
        // Integration tests require local services (DATABASE_URL, REDIS_URL).
        // Run with: npm run test:integration
        // See ONBOARDING.md and US-2.1 for environment bootstrap.
      },
    },
  ],
});
