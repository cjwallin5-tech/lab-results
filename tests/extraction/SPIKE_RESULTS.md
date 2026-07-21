# Extraction first spike — results and accuracy bar rationale

Referenced by SPEC.md "Definition of done" #2. This is the one-time record of the spike
that set the bar; it is not re-run automatically and will go stale — treat it as a
snapshot, not a live dashboard.

---

## UPDATE 2026-07-22 — measured against the current corpus (supersedes the spike below)

**The spike below is historical** — it describes an earlier corpus that has since been replaced.
The current corpus is the 5-scenario `tests/extraction/<id>/` set, measured by
`npm run eval:extract` (opt-in, not CI).

**Result (2026-07-22 · 5 scenarios · 38 rows):** 0 missing, 0 fabricated, 100% exact-match on all
scored fields, 100% `rawName`. Snapshot, not a verdict — small n; re-run before shipping.

**Bar (SPEC DoD #2):** row fidelity **100%**, safety fields **≥98%**, `rawName` **≥95%** — all met.

**Critical-flag detection — REFRAMED (was "100%" above).**

- **The threshold path is the real net.** Detection is threshold-based: the classifier compares the
  value to the curated limit (golden-tested, DoD #1). It's **representation-agnostic** — it flags
  potassium 6.8 as critical no matter what token, or no token, the report prints. The printed flag
  is a _secondary_ signal.
- **The realistic printed-critical is already covered.** On a real provider PDF a critical shows as
  an `H`/`L` flag + a phoned-in footnote (CAP requires phone notify with read-back).
  `liver-metabolic-quest` already models exactly this: glucose 2500 with a `HIGH` flag + the footnote
  _"Critical result called to the ordering physician per laboratory policy"_ — a flag plus a
  phone-call comment.
- **The flag key already covers the real word tokens.** `classify.ts`'s critical markers are
  `{hh, ll, crit, critical, panic}` — so `CRIT`/`PANIC`/`CRITICAL` are already caught; nothing to add.
- **The un-covered symbols (`*`/`**`/`C`) should stay un-covered.** `*` usually means just
  "abnormal," not "critical" — adding it would fire _false_ criticals and over-hold reports. Not
  enumerating them is correct, not a gap.
- **`HH`/`LL` are the data layer, not the PDF.** They're the HL7/FHIR interpretation code — a
  Phase-6 ingest concern, not something a v1 PDF prints.

So the standalone printed-critical-flag sub-bar is retired for the PDF corpus; critical safety is
covered by DoD #1 (classifier) + DoD #3/#4 (held-critical gate + E2E).

---

## Method

For each of the 6 corpus PDFs (`tests/extraction/pdfs/`), a fresh agent instance — with
no access to the hand-written answer key — was given only the PDF path and the
`ExtractedRow` schema (SPEC.md data model), and asked to transcribe every result row.
This approximates SPEC's extraction step ("Claude API reads the PDF and transcribes
each test") ahead of `src/lib/extract/` existing. Each agent's output was diffed
field-by-field against `expected/<name>.json` using an exact-match script (no fuzzy
matching, no partial credit).

## Result

| File | Rows | Field errors | Row errors (missing/extra) |
|---|---|---|---|
| 01-normal-cbc | 10 | 0 | 0 |
| 02-critical-cbc | 10 | 0 | 0 |
| 03-fabricated-test | 11 | 0 | 0 |
| 04-two-column-lipid-liver | 10 | 0 | 0 |
| 05-scanned-bmp | 8 | 0 | 0 |
| 06-multipage-annual-panel | 23 | 0 | 0 |
| **Total** | **72** | **0 / 504 fields** | **0** |

Every row — including the critical `CRIT L` flag, the one-sided ranges (`< 200`, `>
40`), the not-covered fabricated test (EGR), the two-column layout, and the 2-page
report — was transcribed exactly.

## Why the bar is not simply "100%"

A clean 0-error run on 72 rows is a good sign, not proof. Two things that number is not
allowed to paper over:

1. **Sample size.** With 0 observed errors in 72 field-rows, a "rule of three" estimate
   puts the plausible true per-field error rate as high as ~4% at typical confidence —
   the spike can't distinguish "genuinely ~100%" from "we got lucky at n=72."
2. **No true rasterized fixture yet.** `05-scanned-bmp.pdf` looks scanned (rotated,
   low-contrast, noise-textured) but was produced by Chrome's print-to-PDF, which
   preserves a real text layer under the visual effects. It stress-tests *reading
   through visual noise* but not the harder, more realistic case of a flattened image
   with **no text layer at all** (a genuine fax/photocopy scan), which forces true
   OCR/vision reading with no fallback. That fixture doesn't exist in the corpus yet —
   see `README.md` "Growing the corpus."

## The bar (SPEC.md #2)

Until a true no-text-layer scan fixture is added and re-measured, treat this as
provisional and re-run the spike (or the real pipeline, once `src/lib/extract/` exists)
against the expanded corpus before shipping Phase 1:

- **Row fidelity: 100%.** Zero dropped or duplicated result rows across the corpus. A
  row that never reaches the provider's verify screen is worse than one row with a
  wrong field — it can't be caught by human review because it's invisible.
- **Critical-flag detection: 100%.** Every `CRIT` (or equivalent) printed flag must be
  transcribed. This is the one field with zero error tolerance — it's the input to
  FR-07's hold-report gate; a missed critical flag defeats the safety mechanism the
  whole pipeline is built around.
- **Safety-relevant fields (`value`, `unit`, `refLow`, `refHigh`, `rawRange`,
  `labFlags`): ≥ 98% exact-match accuracy.** These feed classification directly.
- **`rawName`: ≥ 95% exact-match accuracy.** Held to a looser bar because normalization
  goes through the analyte dictionary's alias list (`src/lib/analytes/`), which
  tolerates near-miss wording, and a genuinely unmatched test correctly falls back to
  "not covered" (FR-04) rather than being silently dropped.
- Below-bar fields must be caught by `lowConfidenceFields`, not silently guessed —
  a low-confidence field that reaches the provider's verify screen flagged is a pass;
  a wrong field presented with false confidence is not.

Measured the same way as this spike: exact match per field, no partial credit, against
the full corpus in `tests/extraction/expected/`.
