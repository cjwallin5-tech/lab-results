import type { Classification, Explanation, ResultRow } from '@/lib/types';
import { analyteDisplayName, analyteMedlineplusUrl } from '@/lib/data/dictionary';
import { classificationDisplay, type ClassificationDisplay } from './classification-display';

/**
 * Assembles the patient results view model from stored rows and the approved
 * explanation, so the patient components stay presentational. Medical text comes
 * only from the approved Explanation. Bound to the shared types; no panel
 * grouping (the team model has none), so results render as one list.
 */

export interface ResultItem {
  key: string;
  displayName: string;
  value: string;
  unit?: string;
  numericValue: number | null;
  low: number | null;
  high: number | null;
  classification: Classification;
  display: ClassificationDisplay;
  meaning?: string;
  medlineplusUrl?: string;
}

export interface ToneCounts {
  inRange: number;
  outside: number;
  critical: number;
  /** Values the classifier set aside to double-check: implausible or unreadable (FR-08). */
  flagged: number;
  /** Tests with no plain-language explanation yet, the honest fallback (FR-04). */
  notCovered: number;
}

export interface ResultsView {
  items: ResultItem[];
  inRangeCount: number;
  totalCount: number;
  hasCritical: boolean;
  toneCounts: ToneCounts;
}

function toNumber(value: string): number | null {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildResultsView(rows: ResultRow[], explanation: Explanation): ResultsView {
  // Renderer fail-safe (CLAUDE.md rule 7, FR-07): a critical row must never
  // become a patient view model, no matter how this function was reached — the
  // route gate (patient-gate.ts) is the primary defense; this is the last line.
  // Refusing the WHOLE view (not hiding one row) matches FR-07's whole-report
  // hold; the row-level "honest error state" rule is for input problems, and a
  // critical is a safety state, not an input problem. The message is deliberately
  // content-neutral — no test name, no value — since it can surface in logs or a
  // dev overlay; the patient sees the route's generic error boundary.
  const hasCriticalRow = rows.some(
    (row) => row.classification?.kind === 'range' && row.classification.critical,
  );
  if (hasCriticalRow) {
    throw new Error('refusing to build a patient results view: report contains a critical result');
  }

  const meaningByAnalyte = new Map(
    explanation.perTest.map((entry) => [entry.analyteId, entry.text]),
  );

  const items: ResultItem[] = rows.map((row, index) => {
    const classification: Classification = row.classification ?? {
      kind: 'unclassifiable',
      reason: 'no-range',
    };
    return {
      key: `${row.rawName}-${index}`,
      displayName: analyteDisplayName(row.analyteId, row.rawName),
      value: row.value,
      unit: row.unit,
      numericValue: toNumber(row.value),
      low: row.refLow ?? null,
      high: row.refHigh ?? null,
      classification,
      display: classificationDisplay(classification),
      meaning: row.analyteId ? meaningByAnalyte.get(row.analyteId) : undefined,
      medlineplusUrl: analyteMedlineplusUrl(row.analyteId),
    };
  });

  const toneCounts: ToneCounts = { inRange: 0, outside: 0, critical: 0, flagged: 0, notCovered: 0 };
  for (const item of items) {
    const classification = item.classification;
    if (classification.kind === 'range') {
      if (classification.critical) toneCounts.critical += 1;
      else if (classification.band === 'in') toneCounts.inRange += 1;
      else toneCounts.outside += 1;
    } else if (classification.kind === 'not-covered') {
      toneCounts.notCovered += 1;
    } else {
      toneCounts.flagged += 1;
    }
  }

  return {
    items,
    inRangeCount: toneCounts.inRange,
    totalCount: items.length,
    hasCritical: toneCounts.critical > 0,
    toneCounts,
  };
}
