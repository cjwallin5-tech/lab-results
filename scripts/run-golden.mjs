/**
 * Golden-suite runner (SPEC Definition of done, gate 1). Fixtures live in
 * tests/golden/ as JSON files of hand-verified expected classifications; the
 * suite must pass 100% and fixtures are never edited to make a failing
 * implementation pass.
 *
 * Phase 0 stub: the classifier does not exist yet, so this passes only while
 * there are no fixtures. The moment fixtures appear it fails closed until the
 * runner actually executes them against src/lib/classify (Phase 1 work).
 */
import { readdir } from "node:fs/promises";

const GOLDEN_DIR = "tests/golden";

let fixtures = [];
try {
  fixtures = (await readdir(GOLDEN_DIR)).filter((name) => name.endsWith(".json"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

if (fixtures.length > 0) {
  console.error(
    `Golden suite FAILED: ${fixtures.length} fixture file(s) found but the runner is not wired to a classifier yet. Implement src/lib/classify and update this runner before adding fixtures.`,
  );
  process.exit(1);
}

console.log("Golden suite: no fixtures yet (arrive with the Phase 1 classifier). Passing.");
