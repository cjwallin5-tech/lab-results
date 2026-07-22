import type { OutreachEntry, ResultRow } from '@/lib/types';

/** Upper bound on a contact note, bounding stored free text at the boundary. */
export const OUTREACH_NOTE_MAX = 1000;

/**
 * Which of a held report's results the provider must contact the patient about,
 * and which of those are still outstanding. Pure, so the held page stays
 * presentational and the logic is unit-tested. A critical row with no analyteId
 * is skipped: outreach is keyed by analyte, so there is nothing to record against.
 */

export function criticalAnalyteIds(rows: ResultRow[]): string[] {
  return rows
    .filter(
      (row) => row.classification?.kind === 'range' && row.classification.critical && row.analyteId,
    )
    .map((row) => row.analyteId as string);
}

export function outstandingOutreach(criticalIds: string[], outreach: OutreachEntry[]): string[] {
  const contacted = new Set(outreach.map((entry) => entry.analyteId));
  return criticalIds.filter((id) => !contacted.has(id));
}
