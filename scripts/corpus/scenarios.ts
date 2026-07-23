/**
 * Synthetic extraction-corpus scenarios (FR-15: synthetic data only).
 *
 * Each scenario is authored ONCE here and rendered into a report PDF by a
 * layout template (Quest or LabCorp), then a *draft* answer key is derived for
 * the human owner to verify against the rendered page. The scenarios deliberately
 * span the two real lab layouts, because the same data is formatted differently
 * by each lab and that divergence is the main extraction hazard:
 *   - Quest glues the unit into the reference-range cell ("65-99 mg/dL"), prints
 *     a NORMAL/HIGH/LOW word in its own Flag column, uses unspaced range dashes,
 *     writes one-sided ranges as "> OR = 60", and interleaves free-text notes.
 *   - LabCorp gives the unit its own column, leaves the Flag column blank when
 *     normal (bold "High"/"Low" otherwise), spaces its range dashes ("65 - 99"),
 *     and writes one-sided ranges as ">59".
 *
 * Patient identities reuse the seeded demo patients where possible (see
 * scripts/seed.ts) and are otherwise obviously fake: fabricated names, DOBs, and
 * example.com contacts. Built as if it were real PHI anyway (safety rule 5).
 *
 * Reference ranges are drawn from public Quest/LabCorp sample reports for realism;
 * they are not clinician-curated and are not thresholds (thresholds live in the
 * analyte dictionary). The matched pair (cmp-quest / cmp-labcorp) shares identical
 * canonical data on purpose, so the ONLY difference between its two answer keys is
 * layout formatting — that is what proves the corpus exercises the layout hazard.
 */

export type LabLayout = 'quest' | 'labcorp';

/**
 * A reference range in canonical form. Each layout renders it (and the draft key
 * transcribes it) in that layout's own notation; `none` means the report prints
 * no usable range for the row (LabCorp "Not Estab.", or a qualitative result).
 */
export type RefRange =
  | { kind: 'two-sided'; low: string; high: string }
  | { kind: 'low-only'; low: string }
  | { kind: 'high-only'; high: string }
  | { kind: 'none' };

export interface ScenarioRow {
  /** Test name exactly as it should print (becomes rawName). */
  name: string;
  /** Result exactly as it should print, verbatim (becomes value). */
  value: string;
  /** Printed unit, or undefined if the row prints none. */
  unit?: string;
  range: RefRange;
  /**
   * Abnormal flag tokens as printed for THIS layout (Quest "HIGH"/"LOW",
   * LabCorp "High"/"Low"), verbatim. Empty means an in-range row: Quest prints
   * "NORMAL" in its flag column, LabCorp leaves the column blank — neither is a
   * flag, so both transcribe to an empty labFlags list.
   */
  flags: string[];
  /**
   * A free-text note printed beneath this row (e.g. an assay/method comment).
   * It is NOT a result line: the extractor must skip it, so it produces no row
   * in the answer key. Present to test that skip behavior.
   */
  footnote?: string;
}

export interface ScenarioSection {
  /** Panel header printed as a bold section row (e.g. "Comprehensive Metabolic Panel"). */
  title: string;
  rows: ScenarioRow[];
}

export interface Scenario {
  /** Directory name under tests/extraction/. Stable once the answer key is verified. */
  id: string;
  layout: LabLayout;
  /** What this scenario is meant to exercise — surfaced in the corpus README and handoff. */
  exercises: string;
  patient: { name: string; dob: string; gender: string };
  /** Printed timestamps (synthetic). */
  collected: string;
  reported: string;
  physician: string;
  sections: ScenarioSection[];
}

const NORMAL: string[] = [];

export const SCENARIOS: Scenario[] = [
  // --- Matched pair (same canonical data, two layouts) -----------------------
  {
    id: 'cmp-quest',
    layout: 'quest',
    exercises:
      'Quest layout; unit glued into the range cell; one-sided eGFR ("> OR = 60"); an interleaved footnote the extractor must skip. Matched with cmp-labcorp.',
    patient: { name: 'Pat Placeholder', dob: '01/15/1985', gender: 'F' },
    collected: '03/04/2026 08:12AM PST',
    reported: '03/05/2026 06:40PM PST',
    physician: 'Dana Demo, MD',
    sections: [
      {
        title: 'Comprehensive Metabolic Panel',
        rows: [
          {
            name: 'GLUCOSE',
            value: '85',
            unit: 'mg/dL',
            range: { kind: 'two-sided', low: '65', high: '99' },
            flags: NORMAL,
          },
          {
            name: 'UREA NITROGEN (BUN)',
            value: '14',
            unit: 'mg/dL',
            range: { kind: 'two-sided', low: '7', high: '25' },
            flags: NORMAL,
          },
          {
            name: 'CREATININE',
            value: '0.89',
            unit: 'mg/dL',
            range: { kind: 'two-sided', low: '0.70', high: '1.30' },
            flags: NORMAL,
          },
          {
            name: 'EGFR',
            value: '103',
            unit: 'mL/min/1.73',
            range: { kind: 'low-only', low: '60' },
            flags: NORMAL,
            footnote:
              'The eGFR is based on the CKD-EPI 2021 equation and is reported as mL/min/1.73m2.',
          },
          {
            name: 'SODIUM',
            value: '140',
            unit: 'mmol/L',
            range: { kind: 'two-sided', low: '135', high: '146' },
            flags: NORMAL,
          },
          {
            name: 'POTASSIUM',
            value: '4.4',
            unit: 'mmol/L',
            range: { kind: 'two-sided', low: '3.5', high: '5.3' },
            flags: NORMAL,
          },
          {
            name: 'CALCIUM',
            value: '9.3',
            unit: 'mg/dL',
            range: { kind: 'two-sided', low: '8.6', high: '10.3' },
            flags: NORMAL,
          },
          {
            name: 'PROTEIN, TOTAL',
            value: '7.2',
            unit: 'g/dL',
            range: { kind: 'two-sided', low: '6.1', high: '8.1' },
            flags: NORMAL,
          },
          {
            name: 'ALBUMIN',
            value: '4.4',
            unit: 'g/dL',
            range: { kind: 'two-sided', low: '3.6', high: '5.1' },
            flags: NORMAL,
          },
          {
            name: 'ALT',
            value: '20',
            unit: 'U/L',
            range: { kind: 'two-sided', low: '9', high: '46' },
            flags: NORMAL,
          },
        ],
      },
    ],
  },
  {
    id: 'cmp-labcorp',
    layout: 'labcorp',
    exercises:
      'LabCorp layout; unit in its own column; spaced range dashes; one-sided eGFR (">60"). Same canonical data as cmp-quest — the answer keys differ ONLY by layout formatting.',
    patient: { name: 'Pat Placeholder', dob: '01/15/1985', gender: 'F' },
    collected: '03/04/2026 0812 Local',
    reported: '03/05/2026 1840 ET',
    physician: 'D DEMO',
    sections: [
      {
        title: 'Comp. Metabolic Panel (14)',
        rows: [
          {
            name: 'Glucose',
            value: '85',
            unit: 'mg/dL',
            range: { kind: 'two-sided', low: '65', high: '99' },
            flags: NORMAL,
          },
          {
            name: 'BUN',
            value: '14',
            unit: 'mg/dL',
            range: { kind: 'two-sided', low: '7', high: '25' },
            flags: NORMAL,
          },
          {
            name: 'Creatinine',
            value: '0.89',
            unit: 'mg/dL',
            range: { kind: 'two-sided', low: '0.70', high: '1.30' },
            flags: NORMAL,
          },
          {
            name: 'eGFR',
            value: '103',
            unit: 'mL/min/1.73',
            range: { kind: 'low-only', low: '60' },
            flags: NORMAL,
          },
          {
            name: 'Sodium',
            value: '140',
            unit: 'mmol/L',
            range: { kind: 'two-sided', low: '135', high: '146' },
            flags: NORMAL,
          },
          {
            name: 'Potassium',
            value: '4.4',
            unit: 'mmol/L',
            range: { kind: 'two-sided', low: '3.5', high: '5.3' },
            flags: NORMAL,
          },
          {
            name: 'Calcium',
            value: '9.3',
            unit: 'mg/dL',
            range: { kind: 'two-sided', low: '8.6', high: '10.3' },
            flags: NORMAL,
          },
          {
            name: 'Protein, Total',
            value: '7.2',
            unit: 'g/dL',
            range: { kind: 'two-sided', low: '6.1', high: '8.1' },
            flags: NORMAL,
          },
          {
            name: 'Albumin',
            value: '4.4',
            unit: 'g/dL',
            range: { kind: 'two-sided', low: '3.6', high: '5.1' },
            flags: NORMAL,
          },
          {
            name: 'ALT (SGPT)',
            value: '20',
            unit: 'U/L',
            range: { kind: 'two-sided', low: '9', high: '46' },
            flags: NORMAL,
          },
        ],
      },
    ],
  },

  // --- Held-critical (Quest) -------------------------------------------------
  {
    id: 'critical-cbc-quest',
    layout: 'quest',
    exercises:
      'Held-critical path: potassium 6.8 mmol/L with a printed HIGH flag (above the curated critical threshold). Quest spelled-out cell-count units ("Thousand/uL").',
    patient: { name: 'Sam Sample', dob: '06/30/1992', gender: 'M' },
    collected: '03/06/2026 09:50AM PST',
    reported: '03/06/2026 04:15PM PST',
    physician: 'Dana Demo, MD',
    sections: [
      {
        title: 'CBC (includes Differential and Platelets)',
        rows: [
          {
            name: 'WHITE BLOOD CELL COUNT',
            value: '6.2',
            unit: 'Thousand/uL',
            range: { kind: 'two-sided', low: '3.8', high: '10.8' },
            flags: NORMAL,
          },
          {
            name: 'HEMOGLOBIN',
            value: '14.1',
            unit: 'g/dL',
            range: { kind: 'two-sided', low: '13.2', high: '17.1' },
            flags: NORMAL,
          },
          {
            name: 'HEMATOCRIT',
            value: '42.0',
            unit: '%',
            range: { kind: 'two-sided', low: '38.5', high: '50.0' },
            flags: NORMAL,
          },
          {
            name: 'PLATELET COUNT',
            value: '250',
            unit: 'Thousand/uL',
            range: { kind: 'two-sided', low: '140', high: '400' },
            flags: NORMAL,
          },
        ],
      },
      {
        title: 'Basic Metabolic Panel',
        rows: [
          {
            name: 'SODIUM',
            value: '139',
            unit: 'mmol/L',
            range: { kind: 'two-sided', low: '135', high: '146' },
            flags: NORMAL,
          },
          {
            name: 'POTASSIUM',
            value: '6.8',
            unit: 'mmol/L',
            range: { kind: 'two-sided', low: '3.5', high: '5.3' },
            flags: ['HIGH'],
          },
          {
            name: 'CHLORIDE',
            value: '104',
            unit: 'mmol/L',
            range: { kind: 'two-sided', low: '98', high: '110' },
            flags: NORMAL,
          },
        ],
      },
    ],
  },

  // --- Unknown test + one-sided range (LabCorp) ------------------------------
  {
    id: 'thyroid-vitd-labcorp',
    layout: 'labcorp',
    exercises:
      'Unknown test (Thyroglobulin Antibody — not in the dictionary → "not covered"); one-sided high-only range ("<1.0") with an abnormal High flag; LabCorp layout.',
    patient: { name: 'Tess Testcase', dob: '11/02/1978', gender: 'F' },
    collected: '03/07/2026 0730 Local',
    reported: '03/08/2026 1102 ET',
    physician: 'D DEMO',
    sections: [
      {
        title: 'Thyroid Panel',
        rows: [
          {
            name: 'TSH',
            value: '2.10',
            unit: 'uIU/mL',
            range: { kind: 'two-sided', low: '0.450', high: '4.500' },
            flags: NORMAL,
          },
          {
            name: 'Free T4',
            value: '1.30',
            unit: 'ng/dL',
            range: { kind: 'two-sided', low: '0.82', high: '1.77' },
            flags: NORMAL,
          },
          {
            name: 'Thyroglobulin Antibody',
            value: '1.5',
            unit: 'IU/mL',
            range: { kind: 'high-only', high: '1.0' },
            flags: ['High'],
          },
        ],
      },
      {
        title: 'Vitamin D, 25-Hydroxy',
        rows: [
          {
            name: 'Vitamin D, 25-Hydroxy',
            value: '32.0',
            unit: 'ng/mL',
            range: { kind: 'two-sided', low: '30.0', high: '100.0' },
            flags: NORMAL,
          },
        ],
      },
    ],
  },

  // --- Implausible value + non-numeric result (Quest) ------------------------
  {
    id: 'liver-metabolic-quest',
    layout: 'quest',
    exercises:
      'Implausible value (glucose 15000 mg/dL, above the curated plausibility ceiling → "double-check", never explained); a qualitative non-numeric result ("Non-Reactive") with no range; Quest footnote to skip.',
    patient: { name: 'Alex Example', dob: '09/22/1969', gender: 'M' },
    collected: '03/09/2026 07:05AM PST',
    reported: '03/09/2026 05:20PM PST',
    physician: 'Dana Demo, MD',
    sections: [
      {
        title: 'Comprehensive Metabolic Panel',
        rows: [
          {
            name: 'GLUCOSE',
            value: '15000',
            unit: 'mg/dL',
            range: { kind: 'two-sided', low: '65', high: '99' },
            flags: ['HIGH'],
            footnote: 'Result exceeds analytical measurement range; repeat analysis requested.',
          },
          {
            name: 'ALT',
            value: '45',
            unit: 'U/L',
            range: { kind: 'two-sided', low: '9', high: '46' },
            flags: NORMAL,
          },
          {
            name: 'AST',
            value: '30',
            unit: 'U/L',
            range: { kind: 'two-sided', low: '10', high: '35' },
            flags: NORMAL,
          },
          {
            name: 'ALKALINE PHOSPHATASE',
            value: '88',
            unit: 'U/L',
            range: { kind: 'two-sided', low: '35', high: '144' },
            flags: NORMAL,
          },
          {
            name: 'BILIRUBIN, TOTAL',
            value: '0.7',
            unit: 'mg/dL',
            range: { kind: 'two-sided', low: '0.2', high: '1.2' },
            flags: NORMAL,
          },
          {
            name: 'ALBUMIN',
            value: '4.2',
            unit: 'g/dL',
            range: { kind: 'two-sided', low: '3.6', high: '5.1' },
            flags: NORMAL,
          },
        ],
      },
      {
        title: 'Hepatitis B Surface Antigen',
        rows: [
          {
            name: 'HEPATITIS B SURFACE AG',
            value: 'Non-Reactive',
            range: { kind: 'none' },
            flags: NORMAL,
          },
        ],
      },
    ],
  },
];
