import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:%%PORT%%',
    serviceWorkers: 'allow',
  },
  webServer: {
    command: 'node utils/build.js && npx --yes serve dist -l %%PORT%% --single',
    port: %%PORT%%,
    reuseExistingServer: false,
  },
});
