import { defineConfig } from '@playwright/test';

const PORT = 3101;

/** Drives the web page against its synthetic mock data (no external services). */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `http://localhost:${PORT}/provider/sign-in`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
