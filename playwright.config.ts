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
    // Keep the suite hermetic ("no external services"): force the offline
    // drafting/extraction path even when ANTHROPIC_API_KEY is present in
    // .env.local. Drafting gates on the key alone, so without this a local E2E
    // run would make real, paid, non-deterministic model calls while CI (no key)
    // takes the offline path — different code for the same assertion.
    // DATA_OFFLINE does the same for the data layer: next dev auto-loads
    // .env.local, so without it a local run with Supabase creds would drive the
    // real dev database (and its persisted state) instead of the seeded mock.
    // E2E_TEST_HOOKS exposes the read-only email-count route the suite uses to
    // prove a send reached the seam; it 404s everywhere else.
    env: { LLM_OFFLINE: '1', DATA_OFFLINE: '1', E2E_TEST_HOOKS: '1' },
  },
});
