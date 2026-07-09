/**
 * The three data shapes from SPEC.md (Data model, agreed 2026-07-08).
 * These are the seam between the three tracks: Content fills in Analyte and
 * ContentEntry, the classification engine reads them, the UI displays the
 * result. Change them only by team agreement, and never rename an Analyte id
 * once golden fixtures reference it.
 */

/** A range with optional sides: a missing side means "no bound that way". */
export interface Range {
  low?: number;
  high?: number;
}

/** A unit a user may enter, with the multiplier into the canonical unit. */
export interface AcceptedUnit {
  unit: string;
  /** value_in_canonical = value * factor; the canonical unit's own factor is 1. */
  factor: number;
}

/**
 * The curated facts about one test (~40-60 total), versioned in the repo.
 * This is the reference data the classification code runs on.
 */
export interface Analyte {
  id: string;
  /** Every way a person might write the test: full name plus abbreviations. */
  names: string[];
  canonical_unit: string;
  accepted_units: AcceptedUnit[];
  /** Curated adult fallback range, used only when the user did not enter theirs. */
  typical_range: Range;
  /**
   * Danger thresholds that trigger the urgent banner (FR-07). Absent means the
   * test never triggers it. Cited source and clinician sign-off required.
   */
  critical_low?: number;
  critical_high?: number;
  /** "Physically impossible, probably a typo" bounds (FR-09). */
  plausible_min?: number;
  plausible_max?: number;
  /** Panel the test belongs to (CBC, CMP, lipid, thyroid, ...) for grouping. */
  panel: string;
}

/**
 * The human-reviewed writing for one test, 1:1 with Analyte. The only source
 * of user-facing medical text. reviewed_by null means not approved, and the
 * content-review gate blocks shipping it (FR-13).
 */
export interface ContentEntry {
  analyte_id: string;
  what_it_measures: string;
  /**
   * Optional per direction. If absent for the direction a value lands in, the
   * UI shows what_it_measures plus the standard provider-redirect line, never
   * invented text.
   */
  meaning_low?: string;
  meaning_high?: string;
  reviewed_by: string | null;
  reviewed_date: string | null;
}

export type Classification =
  | "low"
  | "normal"
  | "high"
  | "critical"
  | "implausible"
  | "unknown-test";

/** Which range classified the value, so the UI can label the fallback (FR-06). */
export type RangeSource = "user" | "typical";

/**
 * What the person typed plus the derived answer. Session-only, in the browser,
 * never persisted (FR-15).
 */
export interface UserResult {
  /** Matched Analyte.id, or empty string for an uncovered test (FR-11). */
  analyte_id: string;
  /** Exactly what the user picked or typed, echoed back and driving FR-11. */
  raw_name: string;
  value: number;
  unit: string;
  /** The range printed on their own report, if entered; wins over typical (FR-05). */
  user_range?: Range;
  derived?: {
    classification: Classification;
    range_source: RangeSource;
  };
}
