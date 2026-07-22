import type { ResultRow } from '@/lib/types';
import { isLiveLLM } from '@/lib/llm';
import { assertNoCriticalRows, buildDraftInput } from './build-input';
import { offlineDraft } from './offline';
import { assembleDraft } from './verify-output';
import type { DraftContent } from './schema';

/**
 * Draft the patient explanation for a verified report (FR-09). Grounded only in
 * the deterministic classifications + fetched MedlinePlus text; the model never
 * decides a classification (safety rule 3) and never supplies a source (built in
 * code here). Returns the content fields of an Explanation, persisted as a draft.
 *
 * Held-critical refusal — redundant with the gate in confirmVerificationAction,
 * because no code path may skip a safety gate (CLAUDE.md): if ANY row is
 * critical, the whole report is held (FR-07) and nothing is drafted. This is a
 * whole-report refusal, deliberately separate from buildDraftInput's per-row drop
 * of implausible/not-covered/unclassifiable rows — a critical result must never
 * be quietly filtered out while the rest of the report is drafted.
 *
 * Live when an API key is present, else the deterministic offline draft, so the
 * flow runs with no credentials. Both paths pass through the same 1:1 perTest
 * check and code-built sources.
 */
export async function draftExplanation(input: { rows: ResultRow[] }): Promise<DraftContent> {
  assertNoCriticalRows(input.rows);
  const rows = buildDraftInput(input.rows);
  // Live when an API key is present, else the deterministic offline draft. The
  // live path is imported dynamically so the offline path never loads the vendor
  // SDK. assembleDraft then applies the structural guarantees (perTest 1:1 +
  // code-built sources) to whichever output came back.
  const output = isLiveLLM() ? await (await import('./live')).liveDraft(rows) : offlineDraft(rows);
  return assembleDraft(rows, output);
}

export { assertNoCriticalRows, buildDraftInput, derivePrintedRange } from './build-input';
export { assertPerTestMatches, assembleDraft, buildSources } from './verify-output';
export { offlineDraft } from './offline';
export type { DraftContent, DraftInputRow, DraftOutput } from './schema';
