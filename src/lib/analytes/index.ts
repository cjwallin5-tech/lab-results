import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { AnalyteEntry } from "@/lib/model/types";
import { analyteEntrySchema } from "./schema";
import { normalizeName } from "./match";

/**
 * Loads and indexes the curated analyte dictionary. Server-only: reads the
 * committed JSON files, validates each through the shared schema, and caches
 * the result. Normalization (raw printed name -> dictionary entry) lives here
 * because it is dictionary logic, not extraction logic.
 */

const DICTIONARY_DIR = join(process.cwd(), "src/data/analytes");

interface Dictionary {
  entries: AnalyteEntry[];
  byAlias: Map<string, AnalyteEntry>;
}

let cache: Dictionary | null = null;

function build(): Dictionary {
  const files = readdirSync(DICTIONARY_DIR).filter((file) => file.endsWith(".json"));
  const entries = files
    .map((file) => analyteEntrySchema.parse(JSON.parse(readFileSync(join(DICTIONARY_DIR, file), "utf8"))))
    .sort((a, b) => a.id.localeCompare(b.id));

  const byAlias = new Map<string, AnalyteEntry>();
  for (const entry of entries) {
    for (const alias of entry.aliases) {
      byAlias.set(normalizeName(alias), entry);
    }
  }
  return { entries, byAlias };
}

function dictionary(): Dictionary {
  if (cache === null) cache = build();
  return cache;
}

/** Every dictionary entry, sorted by id. */
export function loadDictionary(): AnalyteEntry[] {
  return dictionary().entries;
}

/** The entry with this id, or undefined. */
export function getAnalyte(id: string): AnalyteEntry | undefined {
  return dictionary().entries.find((entry) => entry.id === id);
}

/**
 * Match a raw printed test name to a dictionary entry via its aliases, or
 * undefined when nothing matches (the row is then "not covered", never guessed).
 */
export function matchAnalyte(rawName: string): AnalyteEntry | undefined {
  return dictionary().byAlias.get(normalizeName(rawName));
}
