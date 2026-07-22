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
| neutrophils-absolute | 751-8 | lab-tests/blood-differential |
| lymphocytes-absolute | 731-0 | lab-tests/blood-differential |
| monocytes-absolute | 742-7 | lab-tests/blood-differential |
| eosinophils-absolute | 711-2 | ency/article/003649.htm |
| basophils-absolute | 704-7 | lab-tests/blood-differential |
| mcv | 787-2 | lab-tests/mcv-mean-corpuscular-volume |
| mch | 785-6 | lab-tests/red-blood-cell-rbc-indices |
| mchc | 786-4 | lab-tests/red-blood-cell-rbc-indices |
| rdw | 788-0 | lab-tests/rdw-red-cell-distribution-width |
| anion-gap | 10466-1 | lab-tests/anion-gap-blood-test |
| uric-acid | 3084-1 | lab-tests/uric-acid-test |
| phosphorus | 2777-1 | lab-tests/phosphate-in-blood |
| total-t4 | 3026-2 | lab-tests/thyroxine-t4-test |
| total-t3 | 3053-6 | lab-tests/triiodothyronine-t3-tests |
| free-t3 | 3051-0 | lab-tests/triiodothyronine-t3-tests |
| iron | 2498-4 | lab-tests/iron-tests |
| ferritin | 2276-4 | lab-tests/ferritin-blood-test |
| tibc | 2500-7 | lab-tests/iron-tests |
| vitamin-b12 | 2132-9 | lab-tests/vitamin-b-test |
| folate | 2284-8 | lab-tests/vitamin-b-test |

LDL and HDL have no dedicated MedlinePlus lab-test page, so they point at the
matching MedlinePlus health-topic pages. BUN and total protein point at the
Comprehensive Metabolic Panel page, and bicarbonate at the Electrolyte Panel
page, since those tests are described there rather than on their own page.
Neutrophils/lymphocytes/monocytes/basophils (absolute counts) have no
dedicated MedlinePlus page and point at the general Blood Differential page;
MCH and MCHC point at the RBC Indices page for the same reason. TIBC has no
dedicated page and shares the Iron Tests page with `iron`. Total T4 shares
its MedlinePlus page with `free-t4` (one page covers both), and Total T3 /
Free T3 both share the Triiodothyronine (T3) Tests page. Vitamin B12 and folate have no dedicated page; each points at the combined
"Vitamin B Test" page, which covers all B vitamins including B12 and folate.
Eosinophils (absolute) also shares the Blood Differential page rather than a
dedicated page. None of the new entries use a MedlinePlus `/ency/` (A.D.A.M.
Medical Encyclopedia) page — that content is licensed, not ours to ingest
(CLAUDE.md safety rule 6), and the drafting layer's grounding-cache schema
(`src/lib/draft/medlineplus/schema.ts`) rejects `/ency/` URLs outright.

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

Several of the CBC-differential, RBC-index, and vitamin/iron-study entries
added alongside this table intentionally carry **no** `criticalLow`/`criticalHigh`/
`plausibleLow`/`plausibleHigh` fields at all (e.g. lymphocytes-absolute,
monocytes-absolute, basophils-absolute, mcv, mch, mchc, rdw, anion-gap, tibc,
folate). No credible, citable source (StatPearls, a published institutional
panic-value list, or a PMC case report of a survived extreme) could be found
for those specific values, and per the sourcing policy above an uncited
number is omitted rather than invented.
