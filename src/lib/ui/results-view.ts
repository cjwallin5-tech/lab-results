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
  other: number;
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

  const toneCounts: ToneCounts = { inRange: 0, outside: 0, critical: 0, other: 0 };
  for (const item of items) {
    const classification = item.classification;
    if (classification.kind === 'range') {
      if (classification.critical) toneCounts.critical += 1;
      else if (classification.band === 'in') toneCounts.inRange += 1;
      else toneCounts.outside += 1;
    } else {
      toneCounts.other += 1;
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
