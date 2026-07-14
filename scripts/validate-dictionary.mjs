#!/usr/bin/env node
/**
 * Validates the curated analyte dictionary against the shared zod schema by
 * running the dictionary test suite through Vitest. Exits non-zero on malformed
 * reference data so the build fails rather than shipping a broken dictionary.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const vitestBin = fileURLToPath(new URL("../node_modules/.bin/vitest", import.meta.url));
const result = spawnSync(vitestBin, ["run", "tests/dictionary"], { stdio: "inherit" });

process.exit(result.status ?? 1);
