import { defineConfig, defineProject } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    projects: [
      defineProject({
        test: {
          name: 'unit',
          globals: true,
          environment: 'node',
          include: ['../tests/unit/**/*.test.ts', '../tests/unit/**/*.spec.ts'],
        },
      }),
      defineProject({
        test: {
          name: 'integration',
          globals: true,
          environment: 'node',
          include: ['../tests/integration/**/*.test.ts', '../tests/integration/**/*.spec.ts'],
        },
      }),
      defineProject({
        test: {
          name: 'security',
          globals: true,
          environment: 'node',
          include: ['../tests/security/**/*.test.ts', '../tests/security/**/*.spec.ts'],
        },
      }),
    ],
    coverage: {
      provider: 'v8',
      include: ['../src/**/*.ts'],
      exclude: ['../src/**/*.d.ts', '**/*.test.ts', '**/*.spec.ts', '../tests/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
