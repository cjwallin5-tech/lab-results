/**
 * The shared data model from SPEC.md (provider-facing product).
 *
 * This is the seam between every layer: extraction fills ResultRows, the
 * provider verifies them, the deterministic classifier stamps each row's
 * Classification, drafting produces an Explanation, and the patient page
 * renders the approved Explanation. Change these only by team agreement, and
 * never rename an AnalyteEntry id once golden fixtures reference it.
 *
 * v1 runs on synthetic data only. These shapes are kept FHIR-friendly so a
 * later Observation import is additive, not a rewrite.
 */

/** The report's position through the provider workflow. */
export type ReportStatus =
  | "uploaded"
  | "extracted"
  | "verified"
  | "drafted"
  | "approved"
  | "sent";

/** Synthetic patient identity attached to a report. Never real PHI in v1. */
export interface PatientInfo {
  name: string;
  email: string;
  /** ISO date, YYYY-MM-DD. Used only to gate the share link, never logged. */
  dob: string;
}

/** One uploaded lab report and where it sits in the workflow. */
export interface Report {
  id: string;
  patient: PatientInfo;
  /** Key into the seed PDF store (or storage object ref once real). */
  pdfRef: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

/** Where a value falls relative to the report's own printed reference range. */
export type Position = "below" | "in" | "above";

/**
 * The classifier's verdict for one row. `critical` is orthogonal to position:
 * a value can be in range yet flagged critical by the lab, or above range and
 * not critical. `implausible`, `not-covered`, and `unclassifiable` are terminal
 * states that are never placed on a scale or explained as a real result.
 */
export type Classification =
  | { kind: "placed"; position: Position; critical: boolean }
  | { kind: "implausible" }
  | { kind: "not-covered" }
  | { kind: "unclassifiable" };

/**
 * One extracted test line. Values and ranges are stored exactly as printed
 * (strings); parsing to numbers happens in classification, not extraction.
 */
export interface ResultRow {
  reportId: string;
  /** Test name exactly as printed on the report. */
  rawName: string;
  /** Matched dictionary id, or undefined when no analyte matched (not covered). */
  analyteId?: string;
  /** Value as printed. May be non-numeric (e.g. "Negative"). */
  value: string;
  unit?: string;
  /** Reference-range bounds as printed; one-sided allowed. */
  refLow?: string;
  refHigh?: string;
  /** The full printed range string, when the low/high split is uncertain. */
  rawRange?: string;
  /** Lab-printed flags (H, L, HH, crit, ...), preserved verbatim. */
  labFlags: string[];
  /** Fields the extractor was unsure of; unreadable ones are left empty, never guessed. */
  lowConfidenceFields: string[];
  /** Stamped by the deterministic classifier after the provider verifies the row. */
  classification?: Classification;
}

/** The approved or draft plain-language text for one analyte on one report. */
export interface PerTestExplanation {
  analyteId: string;
  text: string;
}

export type ExplanationStatus = "draft" | "approved";

/**
 * The AI-drafted, provider-approved patient page content for one report.
 * Grounded only in classifications plus fetched MedlinePlus text. Nothing is
 * patient-visible until `status` is "approved".
 */
export interface Explanation {
  reportId: string;
  overallText: string;
  perTest: PerTestExplanation[];
  /** MedlinePlus source URLs backing the drafted text (FR-09 attribution). */
  sources: string[];
  status: ExplanationStatus;
  approvedAt: string | null;
}

/** An unguessable, DOB-gated, expiring link scoped to one report. */
export interface ShareLink {
  reportId: string;
  token: string;
  expiresAt: string;
  openedAt: string | null;
}

/**
 * The curated dictionary entry for one test (~15-20 total in v1). The stable
 * reference data the pipeline runs on: normalization matches a raw name to an
 * `id` via `aliases`, and classification reads the curated thresholds.
 */
export interface AnalyteEntry {
  /** Stable lowercase slug, never renamed once fixtures reference it. */
  id: string;
  loinc: string;
  displayName: string;
  /** Every printed name that should map to this entry, including the displayName. */
  aliases: string[];
  medlineplusUrl: string;
  /** The unit the curated thresholds below are expressed in. */
  unit: string;
  /** Panel this test groups under on the results page (e.g. "Lipid panel"). */
  panel: string;
  /**
   * Curated critical thresholds (cited, clinician-signed before real use). A
   * crossed threshold flags the row critical only when the report unit matches
   * `unit`; absent means this test never triggers the curated-threshold check.
   */
  criticalLow?: number;
  criticalHigh?: number;
  /** "Physically implausible, probably a typo" bounds. */
  plausibleLow?: number;
  plausibleHigh?: number;
}
