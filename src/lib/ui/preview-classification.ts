import type { Classification } from '@/lib/types';
import { matchAnalyte } from '@/lib/analytes';
import { classifyRow } from '@/lib/classify';

/**
 * Live preview of the classification a row would receive if confirmed as-is.
 * Not a parallel implementation: it re-matches the analyte from the edited
 * name and runs the same deterministic classifier the pipeline stamps after
 * the provider confirms (FR-06) — both pure and client-safe — so the preview
 * and the stored classification cannot disagree. The input mapping mirrors
 * confirmVerificationAction: blank unit means "no unit", which skips the
 * curated-threshold check rather than guessing (FR-07).
 */
export function previewClassification(row: {
  rawName: string;
  value: string;
  unit: string;
  refLow?: number;
  refHigh?: number;
  labFlags: string[];
}): Classification {
  return classifyRow({
    value: row.value,
    unit: row.unit.trim() === '' ? undefined : row.unit,
    refLow: row.refLow,
    refHigh: row.refHigh,
    labFlags: row.labFlags,
    analyte: matchAnalyte(row.rawName),
  });
}
