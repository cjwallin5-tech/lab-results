import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Mirror tsconfig's "@/*" path alias so tests outside src/ resolve imports.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    // Pin the data layer to the in-memory mock even if a developer's shell exports
    // Supabase vars: the freeze/outreach/mapping suites assert against the mock, and
    // the Supabase driver's 'server-only' import can't load under plain-Node vitest.
    env: { DATA_OFFLINE: '1' },
  },
});
