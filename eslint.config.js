// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  security.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': 'warn',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-child-process': 'error',
      'no-eval': 'error',
    },
  },
  {
    // Tests and dev scripts use non-literal fs paths by design — disable fs-filename rule there.
    files: ['tests/**', 'scripts/**'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection': 'off',
      'security/detect-unsafe-regex': 'off',
      'no-undef': 'off',
      'no-console': 'off',
    },
  },
  {
    // k6 load-test scripts run inside the k6 runtime — not Node.js.
    // Define k6 globals explicitly so ESLint does not flag them as undefined.
    files: ['infra/scripts/k6/**/*.js'],
    languageOptions: {
      globals: {
        // k6 built-in execution environment globals
        __ENV:  'readonly',
        __ITER: 'readonly',
        __VU:   'readonly',
        open:   'readonly',
        // k6 module re-exports (imported via 'k6' and 'k6/http')
        http:   'readonly',
        check:  'readonly',
        sleep:  'readonly',
        group:  'readonly',
        fail:   'readonly',
        // k6/metrics constructors
        Rate:    'readonly',
        Counter: 'readonly',
        Gauge:   'readonly',
        Trend:   'readonly',
      },
    },
    rules: {
      // k6 scripts use non-literal env vars and dynamic paths by design
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection':        'off',
      'no-console': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '.claude/', '.agent/skills/'],
  },
);
