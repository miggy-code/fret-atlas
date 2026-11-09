import { defineConfig } from '@playwright/test';

// Parallel worktrees each run their own dev server, so the port is configurable.
const port = Number(process.env.PW_PORT ?? 4179);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  use: { baseURL, channel: 'chrome', viewport: { width: 1440, height: 1050 } },
  webServer: { command: `npm run dev -- --port ${port}`, url: baseURL, reuseExistingServer: !process.env.CI },
});
