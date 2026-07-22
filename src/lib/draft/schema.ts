import { z } from 'zod';
import type { Source } from '@/lib/types';

/**
 * The drafting layer's contracts (FR-09). Drafting turns a verified, non-critical
 * report into the patient explanation, grounded ONLY in the deterministic
 * classifications + the MedlinePlus text carried on each input row (CLAUDE.md
 * safety rule 1). The prompt itself is content, owned by the Content Coordinator
 * (`src/lib/draft/prompt.md`); this file is the code contract around it.
 */

/**
 * The model's output — untrusted, so validated before anything downstream uses
 * it (as the extraction layer treats the model's JSON). `sources` is validated
 * for shape but DISCARDED: the pipeline builds sources deterministically from the
 * grounding it already holds, so a fabricated or mis-copied source can never
 * reach a patient (see verify-output.ts). It stays in the schema because the
 * prompt asks the model to emit it; we simply don't trust that copy.
 */
export const draftOutputSchema = z.object({
  overallText: z.string().min(1),
  perTest: z.array(z.object({ analyteId: z.string().min(1), text: z.string().min(1) })),
  sources: z.array(z.object({ analyteId: z.string(), title: z.string(), url: z.string() })),
});
export type DraftOutput = z.infer<typeof draftOutputSchema>;

/**
 * One classified, non-critical row prepared for the prompt — the exact shape
 * `prompt.md` documents under "What you will be given". Built in code from a
 * verified ResultRow + the dictionary + the grounding cache; never from the model.
 */
export type DraftInputRow = {
  analyteId: string;
  displayName: string;
  rawValue: string;
  unit?: string;
  printedRange: string;
  band: 'below' | 'in' | 'above';
  critical: boolean;
  medlineplusExcerpt?: string;
  medlineplusTitle?: string;
  medlineplusUrl?: string;
};

/** The drafting result: the content fields of an Explanation (persisted as a draft). */
export type DraftContent = {
  overallText: string;
  perTest: { analyteId: string; text: string }[];
  sources: Source[];
};
