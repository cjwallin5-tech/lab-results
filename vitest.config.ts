import { configDefaults, defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Playwright drives tests/e2e; keep it out of the Vitest unit run.
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
  },
});
