/**
 * Pure parsing helpers for classification. No I/O, no framework. These turn the
 * strings printed on a lab report into the numbers and unit comparisons the
 * classifier needs, and return null rather than guessing when a value is not a
 * plain number.
 */

/**
 * Parse a printed value or range bound into a number, or null when it is not a
 * plain decimal. Thousands separators are tolerated (platelet counts print as
 * "1,234"); comparator-prefixed strings like "<5" are treated as non-numeric,
 * because the true value is unknown.
 */
export function parseNumber(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const withoutSeparators = trimmed.replace(/,/g, "");
  if (!/^[+-]?\d+(\.\d+)?$/.test(withoutSeparators)) return null;
  const value = Number(withoutSeparators);
  return Number.isFinite(value) ? value : null;
}

/** Curated unit equivalences: printed units that mean the same measurement. */
const UNIT_EQUIVALENCES: readonly (readonly string[])[] = [
  ["mg/dl"],
  ["g/dl"],
  ["mmol/l"],
  ["meq/l"],
  ["ng/ml"],
  ["miu/l", "uiu/ml", "µiu/ml"],
  ["u/l", "iu/l"],
  ["%"],
  // Cell counts print several ways for the same thing.
  ["10*3/ul", "10^3/ul", "10e3/ul", "k/ul", "x10e3/ul", "thou/ul"],
  ["10*9/l", "10^9/l"],
];

function canonicalUnit(unit: string): string {
  return unit.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * Whether a report's printed unit can be confidently matched to the unit the
 * curated thresholds are expressed in. When either is missing, or they do not
 * match, the caller must skip the curated-threshold check rather than guess
 * (FR-07). No unit conversion is performed in v1.
 */
export function unitsMatch(reportUnit: string | undefined, analyteUnit: string): boolean {
  if (reportUnit === undefined) return false;
  const report = canonicalUnit(reportUnit);
  const analyte = canonicalUnit(analyteUnit);
  if (report === "") return false;
  if (report === analyte) return true;
  return UNIT_EQUIVALENCES.some(
    (group) => group.includes(report) && group.includes(analyte),
  );
}
