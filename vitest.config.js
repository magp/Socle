import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'core/**/*.test.js',
      'modules/**/*.test.js',
      'cli/**/*.test.js',
      'reference-app/tests/unit/**/*.test.js',
    ],
    environment: 'node',
  },
});
