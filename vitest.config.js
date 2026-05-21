import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'core/**/*.test.js',
      'modules/**/*.test.js',
      'cli/**/*.test.js',
      'library_tests/**/*.test.js',
      'reference-app/tests/unit/**/*.test.js',
    ],
    exclude: [
      'scaffold/**',  // scaffold/tests/ are templates for app developers, not runnable here
    ],
    environment: 'node',
    setupFiles: ['./core/test-setup.js'],
  },
});
