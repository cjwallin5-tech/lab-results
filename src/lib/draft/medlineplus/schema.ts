import { z } from 'zod';

/**
 * The MedlinePlus grounding cache contract. Drafting is grounded ONLY in
 * classifications + fetched MedlinePlus text (FR-09, CLAUDE.md safety rule 1),
 * so this cache is the drafting layer's sole source of medical prose: one entry
 * per analyte, holding the paraphrasable page text plus the title/link the
 * sources line needs (`src/lib/draft/prompt.md`).
 *
 * The text is fetched once by `scripts/grounding/refresh-grounding.ts` and
 * checked in (START_HERE: "cached per analyte"), so drafting reads a reviewed,
 * frozen copy and never touches the network — the source a provider approves
 * against cannot silently change under an approved draft. The cache is validated
 * through this schema at module load, so a malformed or off-policy entry fails
 * CI, never the runtime (matching the analyte dictionary's fail-fast approach).
 *
 * `excerpt` is optional on purpose: a page whose text could not be extracted
 * yields title+url with no excerpt, and the prompt handles that safely ("state
 * the band, then stop"). An ABSENT excerpt must be a visible, intentional state
 * (the refresh script reports empties) — never a silent parsing failure.
 */
export const groundingEntrySchema = z.object({
  analyteId: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'analyteId must be a lowercase kebab slug'),
  title: z.string().min(1),
  url: z
    .string()
    .url()
    .refine(
      (url) => url.startsWith('https://medlineplus.gov/'),
      'url must be a medlineplus.gov page',
    )
    // A.D.A.M. Medical Encyclopedia pages (/ency/) are licensed, not ours to
    // ingest (CLAUDE.md safety rule 6) — grounding text may only come from
    // NLM-authored pages. Enforced here so an encyclopedia URL can never enter
    // the cache, even if a future dictionary edit or refresh introduces one.
    .refine(
      (url) => !url.includes('/ency/'),
      'url must not be an A.D.A.M. encyclopedia (/ency/) page',
    ),
  excerpt: z.string().min(1).optional(),
});

/** The whole cache: one entry per analyte, sorted by analyteId for minimal diffs. */
export const groundingCacheSchema = z.array(groundingEntrySchema);

export type Grounding = z.infer<typeof groundingEntrySchema>;
