import type { Scenario } from './scenarios';
import { formatRawRange, rangeBounds } from './format';

/**
 * Derives a DRAFT extraction answer key from a scenario, shaped to the
 * extraction contract (src/lib/extract/schema.ts). This is a starting point for
 * human verification, NOT ground truth: it is built from the same data that
 * renders the PDF, so it is "correct by construction" and cannot, on its own,
 * catch a layout bug (e.g. a range that renders as "65 -99"). The owner verifies
 * each draft against the actual rendered page and copies the reviewed key into
 * tests/extraction/<id>/expected.json — that copy is the frozen ground truth.
 *
 * Fields the model must decide for itself are intentionally left at their schema
 * defaults here: `lowConfidenceFields` is always [] (the ideal transcription is
 * confident), and `labFlags` carries only printed abnormal tokens — see the
 * SCORING note in tests/extraction/README.md for how these are scored.
 */
interface DraftRow {
  rawName: string;
  value: string;
  unit?: string;
  refLow?: string;
  refHigh?: string;
  rawRange?: string;
  labFlags: string[];
  lowConfidenceFields: string[];
}

export function draftAnswerKey(scenario: Scenario): { rows: DraftRow[] } {
  const rows: DraftRow[] = [];
  for (const section of scenario.sections) {
    for (const row of section.rows) {
      const { refLow, refHigh } = rangeBounds(row.range);
      // Built in reading order (name → value → unit → range → flags). Optional
      // fields the report does not print are left undefined; JSON.stringify drops
      // them, matching how the model is told to omit — not null-fill — absent
      // fields. A footnote is not a result line, so it never becomes a row here.
      rows.push({
        rawName: row.name,
        value: row.value,
        unit: row.unit,
        refLow,
        refHigh,
        rawRange: formatRawRange(scenario.layout, row.range),
        labFlags: row.flags,
        lowConfidenceFields: [],
      });
    }
  }
  return { rows };
}
