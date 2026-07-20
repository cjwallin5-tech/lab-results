/**
 * v1 analyte dictionary — the 15 tests most commonly ordered as part of a routine CBC,
 * basic metabolic panel, and the two most common chronic-risk screening tests (cholesterol,
 * TSH). This is what deterministic classification (SPEC.md FR-06/07/08) checks a value
 * against for critical and plausibility bounds — never the printed "normal" reference
 * range, which always comes from the report itself and varies by lab and method.
 *
 * IMPORTANT — human sign-off required before this gates anything in production
 * (CLAUDE.md "Do not touch" + safety rule 3): criticalLow/High and plausibleLow/High
 * below are a first-pass draft assembled from widely-published, cross-institution
 * critical ("panic") value ranges (see citation on each entry) rather than any single
 * lab's exact policy — actual critical thresholds are known to vary institution to
 * institution (Kost GJ, "Critical laboratory value thresholds as revised by a
 * physician panel", Arch Pathol Lab Med; Tietz Fundamentals of Clinical Chemistry and
 * Molecular Diagnostics). Per CLAUDE.md, changing a curated threshold requires a
 * human-provided cited source — treat this file as the starting draft for that review,
 * not a finalized medical decision.
 *
 * Plausibility bounds are intentionally wide: they exist only to catch extraction/OCR
 * errors (e.g. a dropped decimal point), never to make a clinical judgment (FR-08).
 */

import type { AnalyteEntry } from '@/lib/types';

export const ANALYTE_DICTIONARY: AnalyteEntry[] = [
  {
    id: 'hemoglobin',
    loinc: '718-7',
    displayName: 'Hemoglobin',
    aliases: ['Hgb', 'HGB', 'Hemoglobin (Hgb)', 'HGB (HEMOGLOBIN)'],
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/hemoglobin-test/',
    unit: 'g/dL',
    // Critical <7 / >20 g/dL: commonly published adult panic-value range (Kost; Tietz).
    criticalLow: 7.0,
    criticalHigh: 20.0,
    plausibleLow: 3.0,
    plausibleHigh: 24.0,
  },
  {
    id: 'hematocrit',
    loinc: '4544-3',
    displayName: 'Hematocrit',
    aliases: ['Hct', 'HCT', 'Hematocrit (Hct)'],
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/hematocrit-test/',
    unit: '%',
    // Critical <20% / >60%: commonly published adult panic-value range (Kost; Tietz).
    criticalLow: 20,
    criticalHigh: 60,
    plausibleLow: 10,
    plausibleHigh: 75,
  },
  {
    id: 'wbc',
    loinc: '6690-2',
    displayName: 'White Blood Cell Count',
    aliases: ['WBC', 'White Blood Count', 'White Blood Cell Count (WBC)', 'WBC (WHITE BLOOD CELL CT)'],
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/white-blood-count-wbc/',
    unit: 'x10^3/uL',
    // Critical <2.0 / >30.0 x10^3/uL: commonly published adult panic-value range (Kost; Tietz).
    criticalLow: 2.0,
    criticalHigh: 30.0,
    plausibleLow: 0.1,
    plausibleHigh: 200,
  },
  {
    id: 'platelet-count',
    loinc: '777-3',
    displayName: 'Platelet Count',
    aliases: ['Platelets', 'PLT', 'Platelet Count', 'PLT (PLATELET COUNT)'],
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/platelet-tests/',
    unit: 'x10^3/uL',
    // Critical <20 (spontaneous bleeding risk) / >1000 x10^3/uL (thrombosis risk) (Kost; Tietz).
    criticalLow: 20,
    criticalHigh: 1000,
    plausibleLow: 0,
    plausibleHigh: 2000,
  },
  {
    id: 'rbc',
    loinc: '789-8',
    displayName: 'Red Blood Cell Count',
    aliases: ['RBC', 'Red Blood Cell Count (RBC)', 'RBC (RED BLOOD CELL CT)'],
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/red-blood-cell-rbc-count/',
    unit: 'x10^6/uL',
    // No independent critical threshold in most hospital panic-value lists — critical
    // anemia/polycythemia is signaled via hemoglobin/hematocrit instead (Kost; Tietz).
    plausibleLow: 1.0,
    plausibleHigh: 8.0,
  },
  {
    id: 'glucose',
    loinc: '2345-7',
    displayName: 'Glucose',
    aliases: ['Glucose', 'Blood Glucose', 'GLU'],
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/blood-glucose-test/',
    unit: 'mg/dL',
    // Critical <40 (hypoglycemic coma risk) / >500 mg/dL (DKA/HHS risk) (Kost; Tietz).
    criticalLow: 40,
    criticalHigh: 500,
    plausibleLow: 10,
    plausibleHigh: 1000,
  },
  {
    id: 'sodium',
    loinc: '2951-2',
    displayName: 'Sodium',
    aliases: ['Na', 'Sodium (Na)', 'NA+'],
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/sodium-blood-test/',
    unit: 'mEq/L',
    // Critical <120 / >160 mEq/L: commonly published adult panic-value range (Kost; Tietz).
    criticalLow: 120,
    criticalHigh: 160,
    plausibleLow: 100,
    plausibleHigh: 180,
  },
  {
    id: 'potassium',
    loinc: '2823-3',
    displayName: 'Potassium',
    aliases: ['K', 'Potassium (K)', 'K+'],
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/potassium-blood-test/',
    unit: 'mEq/L',
    // Critical <2.5 / >6.5 mEq/L (cardiac arrhythmia risk): commonly published range (Kost; Tietz).
    criticalLow: 2.5,
    criticalHigh: 6.5,
    plausibleLow: 1.5,
    plausibleHigh: 9.0,
  },
  {
    id: 'chloride',
    loinc: '2075-0',
    displayName: 'Chloride',
    aliases: ['Cl', 'Chloride (Cl)'],
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/chloride-blood-test/',
    unit: 'mEq/L',
    // Critical <80 / >120 mEq/L: commonly published adult panic-value range (Kost; Tietz).
    criticalLow: 80,
    criticalHigh: 120,
    plausibleLow: 60,
    plausibleHigh: 140,
  },
  {
    id: 'co2',
    loinc: '2028-9',
    displayName: 'Carbon Dioxide (CO2, Bicarbonate)',
    aliases: ['CO2', 'Bicarbonate', 'HCO3', 'Carbon Dioxide'],
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/carbon-dioxide-co2-in-blood/',
    unit: 'mEq/L',
    // Critical <10 / >40 mEq/L: commonly published adult panic-value range (Kost; Tietz).
    criticalLow: 10,
    criticalHigh: 40,
    plausibleLow: 5,
    plausibleHigh: 50,
  },
  {
    id: 'bun',
    loinc: '3094-0',
    displayName: 'Blood Urea Nitrogen',
    aliases: ['BUN', 'Urea Nitrogen', 'BUN (BLOOD UREA NITROGEN)'],
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/bun-blood-urea-nitrogen/',
    unit: 'mg/dL',
    // Critical >100 mg/dL (severe renal failure); no acute-low panic value is conventionally
    // flagged for BUN (Kost; Tietz).
    criticalHigh: 100,
    plausibleLow: 1,
    plausibleHigh: 200,
  },
  {
    id: 'creatinine',
    loinc: '2160-0',
    displayName: 'Creatinine',
    aliases: ['Creat', 'Cr'],
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/creatinine-test/',
    unit: 'mg/dL',
    // Critical >10 mg/dL (severe renal failure); no acute-low panic value is conventionally
    // flagged for creatinine (Kost; Tietz).
    criticalHigh: 10,
    plausibleLow: 0.1,
    plausibleHigh: 20,
  },
  {
    id: 'calcium',
    loinc: '17861-6',
    displayName: 'Calcium',
    aliases: ['Ca', 'Calcium (Ca)', 'Total Calcium'],
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/calcium-blood-test/',
    unit: 'mg/dL',
    // Critical <6.0 / >13.0 mg/dL (arrhythmia/coma risk): commonly published range (Kost; Tietz).
    criticalLow: 6.0,
    criticalHigh: 13.0,
    plausibleLow: 4.0,
    plausibleHigh: 18.0,
  },
  {
    id: 'total-cholesterol',
    loinc: '2093-3',
    displayName: 'Total Cholesterol',
    aliases: ['Cholesterol', 'Total Chol', 'Chol'],
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/cholesterol-levels/',
    unit: 'mg/dL',
    // A chronic cardiovascular-risk marker, not an acute panic value — no hospital
    // critical-value list flags it; plausibility bounds only guard against extraction error.
    plausibleLow: 50,
    plausibleHigh: 1000,
  },
  {
    id: 'tsh',
    loinc: '3016-3',
    displayName: 'Thyroid-Stimulating Hormone',
    aliases: ['TSH', 'Thyrotropin', 'TSH (Thyroid-stimulating hormone)'],
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/tsh-thyroid-stimulating-hormone-test/',
    unit: 'uIU/mL',
    // An endocrine marker with no acute panic threshold in standard hospital critical-value
    // lists — plausibility bounds only guard against extraction error.
    plausibleLow: 0.001,
    plausibleHigh: 100,
  },
];
