import type { Report, ResultRow } from "@/lib/model/types";
import { getAnalyte, matchAnalyte } from "@/lib/analytes";
import { classifyRow } from "@/lib/classify";
import { extract } from "@/lib/llm";
import type { ClassifiedRowSummary } from "@/lib/llm/schemas";

/**
 * Server-side glue that ties the dictionary, the LLM boundary, and the pure
 * classifier to ResultRows. Extraction transcribes and normalizes; the provider
 * verifies; classification is stamped only from verified rows.
 */

/** Transcribe the report PDF and normalize each row to a dictionary id (unverified). */
export async function extractRows(report: Report, pdfBytes?: Uint8Array): Promise<ResultRow[]> {
  const { rows } = await extract({ pdfRef: report.pdfRef, pdfBytes });
  return rows.map((row) => ({
    reportId: report.id,
    rawName: row.rawName,
    analyteId: matchAnalyte(row.rawName)?.id,
    value: row.value,
    unit: row.unit,
    refLow: row.refLow,
    refHigh: row.refHigh,
    rawRange: row.rawRange,
    labFlags: row.labFlags,
    lowConfidenceFields: row.lowConfidenceFields,
  }));
}

/**
 * Re-normalize each row (in case the provider edited a name during verify) and
 * stamp its classification from the pure classifier. Runs only after verify.
 */
export function classifyRows(rows: ResultRow[]): ResultRow[] {
  return rows.map((row) => {
    const analyte = matchAnalyte(row.rawName);
    return {
      ...row,
      analyteId: analyte?.id,
      classification: classifyRow({
        value: row.value,
        unit: row.unit,
        refLow: row.refLow,
        refHigh: row.refHigh,
        labFlags: row.labFlags,
        analyte,
      }),
    };
  });
}

/** Reduce verified rows to the covered, classified summaries the drafter may use. */
export function summarizeForDraft(rows: ResultRow[]): ClassifiedRowSummary[] {
  const summaries: ClassifiedRowSummary[] = [];
  for (const row of rows) {
    if (row.analyteId === undefined || row.classification === undefined) continue;
    const analyte = getAnalyte(row.analyteId);
    if (analyte === undefined) continue;
    summaries.push({
      analyteId: analyte.id,
      displayName: analyte.displayName,
      panel: analyte.panel,
      value: row.value,
      unit: row.unit,
      classification: row.classification,
    });
  }
  return summaries;
}
