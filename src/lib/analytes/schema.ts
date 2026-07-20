import { z } from 'zod';
import type { AnalyteEntry } from '@/lib/types';

/**
 * Zod schema for a dictionary entry. Malformed reference data must fail the
 * test suite (and so CI), never surface at runtime. The schema is the single
 * source of truth for what a valid AnalyteEntry file looks like, shared by the
 * runtime loader and the dictionary test suite.
 */
export const analyteEntrySchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be a lowercase kebab slug'),
    loinc: z.string().regex(/^\d{1,6}-\d$/, 'loinc must look like 1234-5'),
    displayName: z.string().min(1),
    aliases: z.array(z.string().min(1)).min(1),
    medlineplusUrl: z
      .string()
      .url()
      .refine(
        (url) => url.startsWith('https://medlineplus.gov/'),
        'medlineplusUrl must be a medlineplus.gov page',
      ),
    unit: z.string().min(1),
    panel: z.string().min(1),
    criticalLow: z.number().optional(),
    criticalHigh: z.number().optional(),
    plausibleLow: z.number().optional(),
    plausibleHigh: z.number().optional(),
    // Provenance for the curated thresholds. Present = sourced (the entry cites
    // where its critical/plausibility numbers come from); absent = still an
    // uncited demo value. Extra data beyond the shared AnalyteEntry type, like
    // `panel`; per CLAUDE.md, changing a threshold needs a human-provided source.
    thresholdSource: z.string().min(1).optional(),
  })
  .refine((entry) => entry.aliases.includes(entry.displayName), {
    message: 'aliases must include the displayName',
    path: ['aliases'],
  })
  .refine(
    (entry) =>
      entry.criticalLow === undefined ||
      entry.criticalHigh === undefined ||
      entry.criticalLow < entry.criticalHigh,
    { message: 'criticalLow must be below criticalHigh', path: ['criticalLow'] },
  )
  .refine(
    (entry) =>
      entry.plausibleLow === undefined ||
      entry.plausibleHigh === undefined ||
      entry.plausibleLow < entry.plausibleHigh,
    { message: 'plausibleLow must be below plausibleHigh', path: ['plausibleLow'] },
  )
  // A critical value must never fall outside the plausible range, or a real
  // emergency result could be dismissed as an extraction error (FR-07/FR-08).
  .refine(
    (entry) =>
      entry.criticalLow === undefined ||
      entry.plausibleLow === undefined ||
      entry.plausibleLow <= entry.criticalLow,
    { message: 'plausibleLow must be at or below criticalLow', path: ['plausibleLow'] },
  )
  .refine(
    (entry) =>
      entry.criticalHigh === undefined ||
      entry.plausibleHigh === undefined ||
      entry.plausibleHigh >= entry.criticalHigh,
    { message: 'plausibleHigh must be at or above criticalHigh', path: ['plausibleHigh'] },
  );

// Compile-time guarantee that the schema output satisfies the shared contract.
// (`panel` and `thresholdSource` are extra data the shared type doesn't require;
// that's allowed.)
type SchemaOut = z.infer<typeof analyteEntrySchema>;
const _typeCheck: SchemaOut extends AnalyteEntry ? true : never = true;
void _typeCheck;
