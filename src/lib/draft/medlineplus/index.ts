import { groundingCacheSchema, type Grounding } from './schema';
import groundingData from './grounding.json';

/**
 * The MedlinePlus grounding cache reader — the drafting layer's single source of
 * MedlinePlus source text. The cache is imported statically (not read from disk)
 * so it bundles everywhere the app runs, and validated through the shared schema
 * at module load, so a malformed or off-policy entry fails fast (matching the
 * analyte dictionary loader).
 *
 * This module does NO network I/O: the text is fetched and checked in ahead of
 * time by `scripts/grounding/refresh-grounding.ts`. That keeps drafting
 * deterministic and testable, and freezes the source a provider approves against
 * (FR-10). No `fs`, no vendor SDK, no `server-only` — safe to import from tests.
 */
const ENTRIES: Grounding[] = groundingCacheSchema
  .parse(groundingData)
  .sort((a, b) => a.analyteId.localeCompare(b.analyteId));

const BY_ID = new Map(ENTRIES.map((entry) => [entry.analyteId, entry]));

/** Every grounding entry, sorted by analyteId. */
export function loadGrounding(): Grounding[] {
  return ENTRIES;
}

/**
 * The grounding for this analyte id, or undefined when the analyte has no cache
 * entry. The drafting pipeline passes what this returns to the prompt; a missing
 * entry (or an entry with no excerpt) is a state the prompt handles safely.
 */
export function getGrounding(analyteId: string): Grounding | undefined {
  return BY_ID.get(analyteId);
}

export { groundingEntrySchema, groundingCacheSchema } from './schema';
export type { Grounding } from './schema';
