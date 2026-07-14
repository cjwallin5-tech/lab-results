import type { Classification, Explanation, ResultRow } from "@/lib/model/types";
import { getAnalyte } from "@/lib/analytes";
import { parseNumber } from "@/lib/classify";
import { classificationDisplay, type ClassificationDisplay } from "./classification-display";

/**
 * Assembles the patient results view model from stored rows, the approved
 * explanation, and the dictionary, so the patient components stay presentational.
 * The medical text comes only from the approved Explanation.
 */

export interface ResultItem {
  key: string;
  displayName: string;
  panel: string;
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

export interface ResultGroup {
  panel: string;
  items: ResultItem[];
}

export interface ToneCounts {
  inRange: number;
  outside: number;
  critical: number;
  /** Implausible, unreadable, or not-covered: shown honestly, not as a result. */
  other: number;
}

export interface ResultsView {
  groups: ResultGroup[];
  inRangeCount: number;
  totalCount: number;
  hasCritical: boolean;
  toneCounts: ToneCounts;
}

const PANEL_ORDER = [
  "Lipid panel",
  "Blood sugar",
  "Metabolic panel",
  "Complete blood count",
  "Liver",
  "Thyroid",
  "Vitamins",
  "Inflammation",
];
const OTHER_PANEL = "Other tests";

function panelRank(panel: string): number {
  const index = PANEL_ORDER.indexOf(panel);
  return index === -1 ? PANEL_ORDER.length : index;
}

export function buildResultsView(rows: ResultRow[], explanation: Explanation): ResultsView {
  const meaningByAnalyte = new Map(explanation.perTest.map((entry) => [entry.analyteId, entry.text]));

  const items: ResultItem[] = rows.map((row, index) => {
    const analyte = row.analyteId ? getAnalyte(row.analyteId) : undefined;
    const classification: Classification = row.classification ?? { kind: "unclassifiable" };
    return {
      key: `${row.rawName}-${index}`,
      displayName: analyte?.displayName ?? row.rawName,
      panel: analyte?.panel ?? OTHER_PANEL,
      value: row.value,
      unit: row.unit,
      numericValue: parseNumber(row.value),
      low: parseNumber(row.refLow),
      high: parseNumber(row.refHigh),
      classification,
      display: classificationDisplay(classification),
      meaning: row.analyteId ? meaningByAnalyte.get(row.analyteId) : undefined,
      medlineplusUrl: analyte?.medlineplusUrl,
    };
  });

  const byPanel = new Map<string, ResultItem[]>();
  for (const item of items) {
    const list = byPanel.get(item.panel) ?? [];
    list.push(item);
    byPanel.set(item.panel, list);
  }

  const groups: ResultGroup[] = [...byPanel.entries()]
    .map(([panel, panelItems]) => ({ panel, items: panelItems }))
    .sort((a, b) => panelRank(a.panel) - panelRank(b.panel));

  const toneCounts: ToneCounts = { inRange: 0, outside: 0, critical: 0, other: 0 };
  for (const item of items) {
    const classification = item.classification;
    if (classification.kind === "placed") {
      if (classification.critical) toneCounts.critical += 1;
      else if (classification.position === "in") toneCounts.inRange += 1;
      else toneCounts.outside += 1;
    } else {
      toneCounts.other += 1;
    }
  }

  return {
    groups,
    inRangeCount: toneCounts.inRange,
    totalCount: items.length,
    hasCritical: toneCounts.critical > 0,
    toneCounts,
  };
}
