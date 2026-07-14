import { defineConfig } from "@playwright/test";

const PORT = 3100;

/**
 * Drives the full loop against the offline synthetic build (no credentials). A
 * dedicated data dir keeps the E2E run from touching the local dev store.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `http://localhost:${PORT}/provider/sign-in`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { LAB_DATA_DIR: ".data-e2e" },
  },
});
