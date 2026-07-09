/**
 * Content-review gate (FR-13): CI blocks ship if any ContentEntry has
 * reviewed_by unset. Reads every JSON file in src/data/content/; each file
 * holds one ContentEntry. Passes with zero entries (none written yet) and
 * fails on the first unreviewed one.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CONTENT_DIR = "src/data/content";

/** Returns the analyte_ids of entries a human has not approved. */
export function findUnreviewed(entries) {
  return entries
    .filter((entry) => !entry.reviewed_by)
    .map((entry) => entry.analyte_id ?? "(missing analyte_id)");
}

async function loadEntries(dir) {
  let files;
  try {
    files = await readdir(dir);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const jsonFiles = files.filter((name) => name.endsWith(".json"));
  return Promise.all(
    jsonFiles.map(async (name) =>
      JSON.parse(await readFile(path.join(dir, name), "utf8")),
    ),
  );
}

async function main() {
  const entries = await loadEntries(CONTENT_DIR);
  const unreviewed = findUnreviewed(entries);
  if (unreviewed.length > 0) {
    console.error(
      `Content gate FAILED: ${unreviewed.length} of ${entries.length} entries lack reviewed_by: ${unreviewed.join(", ")}`,
    );
    process.exit(1);
  }
  console.log(
    `Content gate passed: ${entries.length} entries, all reviewed.`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
