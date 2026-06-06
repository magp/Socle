import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:4321',
    serviceWorkers: 'allow',
  },
  webServer: {
    command: 'node utils/build.js && npx --yes serve dist -l 4321 --single',
    port: 4321,
    reuseExistingServer: false,
    cwd: __dirname,
  },
});
