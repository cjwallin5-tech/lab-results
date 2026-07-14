#!/usr/bin/env node
/**
 * Golden-suite runner (SPEC Definition of done, gate 1). Drives the fixtures in
 * tests/golden/ through the real deterministic classifier via Vitest and exits
 * non-zero on any failure, so CI blocks on a classification regression.
 * Fixtures are never edited to make a failing implementation pass.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const vitestBin = fileURLToPath(new URL("../node_modules/.bin/vitest", import.meta.url));
const result = spawnSync(vitestBin, ["run", "tests/golden"], { stdio: "inherit" });

process.exit(result.status ?? 1);
