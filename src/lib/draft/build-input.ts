import type { ResultRow } from '@/lib/types';
import { getAnalyte } from '@/lib/analytes';
import { getGrounding } from '@/lib/draft/medlineplus';
import type { DraftInputRow } from './schema';

/**
 * The printed reference range as the patient will see it restated. The model
 * echoes this back as a number, so a mangled range is a fabricated number
 * (safety rule 1): prefer the verbatim `rawRange`; otherwise compose from the
 * parsed bounds, keeping a one-sided range one-sided ("under 200") rather than
 * emitting a bare number that reads as the wrong bound.
 */
export function derivePrintedRange(row: ResultRow): string {
  if (row.rawRange !== undefined && row.rawRange.trim() !== '') return row.rawRange.trim();
  const { refLow, refHigh } = row;
  if (refLow !== undefined && refHigh !== undefined) return `${refLow}–${refHigh}`;
  if (refHigh !== undefined) return `under ${refHigh}`;
  if (refLow !== undefined) return `over ${refLow}`;
  return '';
}

/**
 * Whole-report critical refusal (FR-07): if ANY row is a critical result, the
 * entire report is held and nothing is drafted — never partially drafted with the
 * critical row quietly filtered out. Redundant with the held gate in
 * confirmVerificationAction, because no code path may skip a safety gate
 * (CLAUDE.md). Deliberately separate from the per-row drop in buildDraftInput.
 */
export function assertNoCriticalRows(rows: ResultRow[]): void {
  const hasCritical = rows.some(
    (row) => row.classification?.kind === 'range' && row.classification.critical,
  );
  if (hasCritical) {
    throw new Error('refusing to draft: a critical result holds the whole report (FR-07)');
  }
}

/**
 * Prepare the rows the drafting model may see. Only `range` results are drafted;
 * `implausible` / `not-covered` / `unclassifiable` rows are dropped (never sent —
 * prompt.md). This is a per-row exclusion; a CRITICAL row is a different matter
 * entirely (it holds the whole report) and is refused upstream in
 * draftExplanation, not filtered here.
 */
export function buildDraftInput(rows: ResultRow[]): DraftInputRow[] {
  const input: DraftInputRow[] = [];
  for (const row of rows) {
    const classification = row.classification;
    if (classification?.kind !== 'range') continue;
    if (row.analyteId === undefined) continue; // a range classification implies a match; defensive
    const analyte = getAnalyte(row.analyteId);
    if (analyte === undefined) continue;
    const grounding = getGrounding(row.analyteId);
    input.push({
      analyteId: row.analyteId,
      displayName: analyte.displayName,
      rawValue: row.value,
      unit: row.unit ?? analyte.unit,
      printedRange: derivePrintedRange(row),
      band: classification.band,
      critical: classification.critical,
      ...(grounding?.excerpt !== undefined ? { medlineplusExcerpt: grounding.excerpt } : {}),
      ...(grounding !== undefined
        ? { medlineplusTitle: grounding.title, medlineplusUrl: grounding.url }
        : {}),
    });
  }
  return input;
}
