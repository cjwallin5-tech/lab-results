import type { AnalyteEntry, Classification, Position } from "@/lib/model/types";
import { parseNumber, unitsMatch } from "./parse";

/**
 * The deterministic classifier. Pure, no I/O, no framework, no LLM. Given one
 * verified result row and its matched dictionary entry (or none), it decides
 * where the value falls against the report's OWN printed range and whether the
 * result is critical. Same input always yields the same output; the golden
 * suite pins every branch.
 */

export interface ClassifyInput {
  /** Value exactly as printed on the report. */
  value: string;
  /** Unit as printed; absent means the curated-threshold check is skipped. */
  unit?: string;
  /** Reference-range bounds as printed; one-sided allowed. */
  refLow?: string;
  refHigh?: string;
  /** Lab-printed flags, verbatim. */
  labFlags: string[];
  /** Matched dictionary entry, or undefined when no analyte matched. */
  analyte?: AnalyteEntry;
}

/** Printed flag tokens that a lab uses to mark a critical/panic result. */
const CRITICAL_FLAG_MARKERS = new Set(["hh", "ll", "crit", "critical", "panic"]);

function hasPrintedCriticalFlag(labFlags: string[]): boolean {
  return labFlags.some((flag) => CRITICAL_FLAG_MARKERS.has(flag.trim().toLowerCase()));
}

/**
 * Whether a curated critical threshold is crossed. Only consulted when the
 * report unit confidently matches the dictionary unit (checked by the caller),
 * so no conversion is ever guessed.
 */
function crossesCuratedThreshold(value: number, analyte: AnalyteEntry): boolean {
  if (analyte.criticalLow !== undefined && value <= analyte.criticalLow) return true;
  if (analyte.criticalHigh !== undefined && value >= analyte.criticalHigh) return true;
  return false;
}

function placeOnRange(value: number, low: number | null, high: number | null): Position {
  if (low !== null && value < low) return "below";
  if (high !== null && value > high) return "above";
  return "in";
}

export function classifyRow(input: ClassifyInput): Classification {
  const { analyte } = input;

  // No dictionary match: honestly uncovered, never guessed onto a scale.
  if (analyte === undefined) return { kind: "not-covered" };

  // Non-numeric values (e.g. "Negative") cannot be placed on a scale.
  const value = parseNumber(input.value);
  if (value === null) return { kind: "unclassifiable" };

  // Physically implausible values short-circuit: never placed or explained.
  if (
    (analyte.plausibleLow !== undefined && value < analyte.plausibleLow) ||
    (analyte.plausibleHigh !== undefined && value > analyte.plausibleHigh)
  ) {
    return { kind: "implausible" };
  }

  // Position is decided against the report's own printed range.
  const low = parseNumber(input.refLow);
  const high = parseNumber(input.refHigh);
  if (low === null && high === null) return { kind: "unclassifiable" };
  const position = placeOnRange(value, low, high);

  // Critical is orthogonal: a printed critical flag, or a curated threshold
  // crossed while the unit confidently matches. A unit mismatch skips the
  // curated check and relies on printed flags alone (FR-07).
  const critical =
    hasPrintedCriticalFlag(input.labFlags) ||
    (unitsMatch(input.unit, analyte.unit) && crossesCuratedThreshold(value, analyte));

  return { kind: "placed", position, critical };
}
