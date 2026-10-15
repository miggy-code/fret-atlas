import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  use: { baseURL: 'http://127.0.0.1:4179', channel: 'chrome', viewport: { width: 1440, height: 1050 } },
  webServer: { command: 'npm run dev -- --port 4179', url: 'http://127.0.0.1:4179', reuseExistingServer: true },
});
