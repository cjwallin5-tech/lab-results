import type { Report, ResultRow } from "@/lib/model/types";

/**
 * Critical-result helpers, pure. A critical result requires the provider to
 * contact the patient directly before the self-serve link can be sent.
 */

/** Distinct analyte ids of rows classified as critical. */
export function criticalAnalyteIds(rows: ResultRow[]): string[] {
  const ids: string[] = [];
  for (const row of rows) {
    if (
      row.analyteId !== undefined &&
      row.classification?.kind === "placed" &&
      row.classification.critical &&
      !ids.includes(row.analyteId)
    ) {
      ids.push(row.analyteId);
    }
  }
  return ids;
}

/** Critical analyte ids that do not yet have a logged direct contact. */
export function outstandingOutreach(report: Report, rows: ResultRow[]): string[] {
  const contacted = new Set(report.outreach.map((entry) => entry.analyteId));
  return criticalAnalyteIds(rows).filter((id) => !contacted.has(id));
}
