import type { Source } from '@/lib/types';
import type { DraftContent, DraftInputRow, DraftOutput } from './schema';

/**
 * Structural check: the model's `perTest` must be exactly 1:1 with the rows it
 * was given — same analyteIds, none added, dropped, or duplicated (prompt.md
 * requires this). A mismatch means the model invented a test or lost one, so the
 * draft is rejected rather than shown. This is one of the two mechanical
 * traceability guarantees; the prose itself (overallText, each perTest text) is
 * not machine-checkable and stays with the prompt + human review.
 */
export function assertPerTestMatches(input: DraftInputRow[], output: DraftOutput): void {
  const expected = input.map((row) => row.analyteId);
  const got = output.perTest.map((entry) => entry.analyteId);
  const expectedSet = new Set(expected);
  const ok =
    got.length === expected.length &&
    new Set(got).size === got.length &&
    got.every((id) => expectedSet.has(id));
  if (!ok) {
    throw new Error(
      `draft perTest does not match input rows (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})`,
    );
  }
}

/**
 * Build the sources list in code — a guarantee, not a check. Sources are pure
 * derived data (analyteId -> the grounding title/url already attached to the
 * row), so the pipeline constructs them itself and discards whatever the model
 * emitted: one entry per explained test that has a source (FR-09), title and url
 * verbatim from the cache. A fabricated or mis-copied source cannot reach a patient.
 */
export function buildSources(input: DraftInputRow[]): Source[] {
  const sources: Source[] = [];
  for (const row of input) {
    if (row.medlineplusTitle !== undefined && row.medlineplusUrl !== undefined) {
      sources.push({
        analyteId: row.analyteId,
        title: row.medlineplusTitle,
        url: row.medlineplusUrl,
      });
    }
  }
  return sources;
}

/**
 * Turn a raw draft output (offline or live) into the stored draft content,
 * applying both mechanical guarantees: perTest must be 1:1 with the input, and
 * sources are rebuilt in code (the raw output's own sources are discarded). Pure
 * and free of the vendor boundary, so the offline pipeline is fully testable.
 */
export function assembleDraft(input: DraftInputRow[], output: DraftOutput): DraftContent {
  assertPerTestMatches(input, output);
  return {
    overallText: output.overallText,
    perTest: output.perTest,
    sources: buildSources(input),
  };
}
