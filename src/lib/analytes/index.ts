import type { AnalyteEntry } from '@/lib/types';
import { analyteEntrySchema } from './schema';
import { normalizeName } from './match';

import albumin from './data/albumin.json';
import alkalinePhosphatase from './data/alkaline-phosphatase.json';
import alt from './data/alt.json';
import ast from './data/ast.json';
import bicarbonate from './data/bicarbonate.json';
import bilirubinTotal from './data/bilirubin-total.json';
import bun from './data/bun.json';
import calcium from './data/calcium.json';
import chloride from './data/chloride.json';
import creatinine from './data/creatinine.json';
import crp from './data/crp.json';
import egfr from './data/egfr.json';
import freeT4 from './data/free-t4.json';
import glucose from './data/glucose.json';
import hdlCholesterol from './data/hdl-cholesterol.json';
import hematocrit from './data/hematocrit.json';
import hemoglobin from './data/hemoglobin.json';
import hemoglobinA1c from './data/hemoglobin-a1c.json';
import ldlCholesterol from './data/ldl-cholesterol.json';
import magnesium from './data/magnesium.json';
import plateletCount from './data/platelet-count.json';
import potassium from './data/potassium.json';
import redBloodCellCount from './data/red-blood-cell-count.json';
import sodium from './data/sodium.json';
import totalCholesterol from './data/total-cholesterol.json';
import totalProtein from './data/total-protein.json';
import triglycerides from './data/triglycerides.json';
import tsh from './data/tsh.json';
import vitaminD from './data/vitamin-d.json';
import whiteBloodCellCount from './data/white-blood-cell-count.json';

/**
 * Loads and indexes the curated analyte dictionary. The JSON files are imported
 * statically (not read from disk) so the dictionary is bundled everywhere the
 * app runs; each entry is validated through the shared schema at module load,
 * so malformed reference data fails fast. Normalization (raw printed name ->
 * dictionary entry) lives here because it is dictionary logic, not extraction
 * logic. The dictionary test suite asserts this list covers every file in
 * ./data, so a new JSON file cannot be silently forgotten.
 */
const RAW_ENTRIES = [
  albumin,
  alkalinePhosphatase,
  alt,
  ast,
  bicarbonate,
  bilirubinTotal,
  bun,
  calcium,
  chloride,
  creatinine,
  crp,
  egfr,
  freeT4,
  glucose,
  hdlCholesterol,
  hematocrit,
  hemoglobin,
  hemoglobinA1c,
  ldlCholesterol,
  magnesium,
  plateletCount,
  potassium,
  redBloodCellCount,
  sodium,
  totalCholesterol,
  totalProtein,
  triglycerides,
  tsh,
  vitaminD,
  whiteBloodCellCount,
];

const ENTRIES: AnalyteEntry[] = RAW_ENTRIES.map((raw) => analyteEntrySchema.parse(raw)).sort(
  (a, b) => a.id.localeCompare(b.id),
);

const BY_ID = new Map(ENTRIES.map((entry) => [entry.id, entry]));

const BY_ALIAS = new Map<string, AnalyteEntry>();
for (const entry of ENTRIES) {
  for (const alias of entry.aliases) {
    BY_ALIAS.set(normalizeName(alias), entry);
  }
}

/** Every dictionary entry, sorted by id. */
export function loadDictionary(): AnalyteEntry[] {
  return ENTRIES;
}

/** The entry with this id, or undefined. */
export function getAnalyte(id: string): AnalyteEntry | undefined {
  return BY_ID.get(id);
}

/**
 * Match a raw printed test name to a dictionary entry via its aliases, or
 * undefined when nothing matches (the row is then "not covered", never guessed).
 */
export function matchAnalyte(rawName: string): AnalyteEntry | undefined {
  return BY_ALIAS.get(normalizeName(rawName));
}
