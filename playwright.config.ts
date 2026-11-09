import { defineConfig } from '@playwright/test';

// Parallel worktrees each run their own dev server, so the port is configurable.
const port = Number(process.env.PW_PORT ?? 4179);
const baseURL = `http://127.0.0.1:${port}`;
const ci = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  forbidOnly: ci,
  retries: ci ? 2 : 0,
  reporter: ci ? [['github'], ['html', { open: 'never' }]] : 'list',
  // CI uses the Chromium build pinned to this Playwright version; local runs use the installed Chrome.
  use: { baseURL, channel: ci ? undefined : 'chrome', viewport: { width: 1440, height: 1050 }, trace: ci ? 'on-first-retry' : 'off' },
  webServer: { command: `npm run dev -- --port ${port}`, url: baseURL, reuseExistingServer: !ci },
});
