# Analyte dictionary

One JSON file per test, each an `AnalyteEntry` (shape defined in the shared
types at `src/lib/types/index.ts`, validated by `src/lib/analytes/schema.ts`;
new files must also be registered in `src/lib/analytes/index.ts` — the test
suite fails if one is forgotten). This is
the curated reference data the pipeline runs on: normalization matches a raw
printed name to an `id` via `aliases`, and classification reads the curated
thresholds. Never rename an `id` once golden fixtures reference it.

## Sources

LOINC codes and MedlinePlus URLs below. Every `medlineplusUrl` was checked to
return HTTP 200. LOINC codes are the common codes for each test and should be
reconfirmed against [loinc.org](https://loinc.org) before any real-world use.

| id | LOINC | MedlinePlus page |
| --- | --- | --- |
| glucose | 1558-6 | lab-tests/blood-glucose-test |
| hemoglobin-a1c | 4548-4 | lab-tests/hemoglobin-a1c-hba1c-test |
| total-cholesterol | 2093-3 | lab-tests/cholesterol-levels |
| ldl-cholesterol | 13457-7 | ldlthebadcholesterol.html |
| hdl-cholesterol | 2085-9 | hdlthegoodcholesterol.html |
| triglycerides | 2571-8 | lab-tests/triglycerides-test |
| hemoglobin | 718-7 | lab-tests/hemoglobin-test |
| white-blood-cell-count | 6690-2 | lab-tests/white-blood-count-wbc |
| platelet-count | 777-3 | lab-tests/platelet-tests |
| sodium | 2951-2 | lab-tests/sodium-blood-test |
| potassium | 2823-3 | lab-tests/potassium-blood-test |
| creatinine | 2160-0 | lab-tests/creatinine-test |
| tsh | 3016-3 | lab-tests/tsh-thyroid-stimulating-hormone-test |
| vitamin-d | 62292-8 | lab-tests/vitamin-d-test |
| alt | 1742-6 | lab-tests/alt-blood-test |
| ast | 1920-8 | lab-tests/ast-test |
| bun | 3094-0 | lab-tests/comprehensive-metabolic-panel-cmp |
| calcium | 17861-6 | lab-tests/calcium-blood-test |
| chloride | 2075-0 | lab-tests/chloride-blood-test |
| bicarbonate | 1963-8 | lab-tests/electrolyte-panel |
| egfr | 33914-3 | lab-tests/glomerular-filtration-rate-gfr-test |
| magnesium | 2601-3 | lab-tests/magnesium-blood-test |
| albumin | 1751-7 | lab-tests/albumin-blood-test |
| total-protein | 2885-2 | lab-tests/comprehensive-metabolic-panel-cmp |
| bilirubin-total | 1975-2 | lab-tests/bilirubin-blood-test |
| alkaline-phosphatase | 6768-6 | lab-tests/alkaline-phosphatase |
| hematocrit | 4544-3 | lab-tests/hematocrit-test |
| free-t4 | 3024-7 | lab-tests/thyroxine-t4-test |
| crp | 1988-5 | lab-tests/c-reactive-protein-crp-test |

LDL and HDL have no dedicated MedlinePlus lab-test page, so they point at the
matching MedlinePlus health-topic pages. BUN and total protein point at the
Comprehensive Metabolic Panel page, and bicarbonate at the Electrolyte Panel
page, since those tests are described there rather than on their own page.

## Thresholds are demo values, not clinical truth

The `criticalLow` / `criticalHigh` and `plausibleLow` / `plausibleHigh` values
exist so the app can exercise its critical and implausible states on synthetic
data. They are approximate, drawn from commonly published adult critical-value
tables, and are **not clinician-approved**. Per `CLAUDE.md`, curated critical and
plausibility thresholds must be replaced with clinician-signed, cited values
before any real use. Some tests intentionally omit a critical bound where none is
clinically meaningful (for example total cholesterol has no critical low, and
HDL has no critical high).

Classification always prefers the reference range printed on the report itself;
these thresholds only add the orthogonal critical flag when the report's unit
confidently matches the `unit` here.
