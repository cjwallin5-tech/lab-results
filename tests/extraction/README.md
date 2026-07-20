# Extraction corpus

Synthetic lab reports + expected extraction, doubling as the extraction eval set
(ROADMAP Phase 1; SPEC "Definition of done" item 2). Each scenario is one report
rendered as a real, text-layer PDF plus a human-verified answer key:

```
tests/extraction/<id>/report.pdf      the rendered report (committed)
tests/extraction/<id>/expected.json   the verified answer key (frozen ground truth)
```

Answer keys conform to the extraction contract in `src/lib/extract/schema.ts`.
Synthetic data only (FR-15): fabricated patients, no real PHI.

## Why two layouts

The corpus spans the two real lab layouts on purpose, because they format the
same data differently and that divergence is the main extraction hazard:

| | Quest | LabCorp |
| --- | --- | --- |
| Unit | glued into the range cell (`65-99 mg/dL`) | its own column |
| Flag (normal) | word `NORMAL` | blank |
| Flag (abnormal) | `HIGH` / `LOW` (colored) | bold `High` / `Low` |
| Range dashes | unspaced (`65-99`) | spaced (`65 - 99`) |
| One-sided range | `> OR = 60` | `>60` |
| No range | — | `Not Estab.` |
| Cell-count units | `Thousand/uL` | `x10E3/uL` |

`cmp-quest` and `cmp-labcorp` are a **matched pair**: identical canonical data,
so the only difference between their two answer keys is layout formatting — that
is what proves the corpus exercises the hazard rather than two arbitrary reports.

## Scenarios

| id | layout | exercises |
| --- | --- | --- |
| `cmp-quest` | Quest | glued unit; one-sided eGFR; an interleaved footnote the extractor must skip |
| `cmp-labcorp` | LabCorp | unit column; spaced ranges; one-sided eGFR (matched with `cmp-quest`) |
| `critical-cbc-quest` | Quest | held-critical potassium 6.8 with a printed `HIGH` flag; spelled-out cell-count units |
| `thyroid-vitd-labcorp` | LabCorp | unknown test (not in the dictionary); one-sided high-only range with a `High` flag |
| `liver-metabolic-quest` | Quest | implausible glucose (above the plausibility ceiling); a non-numeric `Non-Reactive` result; footnote to skip |

These are the eval scenarios. They are distinct from the E2E scenario
requirements (SPEC DoD item 3), which run on the offline fixtures / mock data on
the patient-facing loop, not on this corpus.

## Regenerating the PDFs

`npm run gen:corpus` renders every scenario in `scripts/corpus/scenarios.ts` to
`tests/extraction/<id>/report.pdf` (via headless Chromium's `page.pdf()`) and
writes a **draft** answer key to `scratch/corpus/<id>.expected.json`.

The PDF bytes are not reproducible (Chromium embeds timestamps), so `report.pdf`
is a committed artifact, not a byte-frozen one. **Regenerating a report.pdf
requires re-verifying its `expected.json`** — the key is frozen against a
specific rendered page.

## Adding or changing an answer key (the human gate)

The generator writes only `report.pdf` into this directory; it never writes
`expected.json` here. The answer key is human-verified ground truth (CLAUDE.md:
changing a `tests/extraction/*` expected output is a human product decision):

1. Run `npm run gen:corpus`.
2. Open `tests/extraction/<id>/report.pdf` and read the draft
   `scratch/corpus/<id>.expected.json` **against the rendered page** — the draft
   is derived from the same data that rendered the PDF, so it cannot catch a
   layout bug on its own; reading the actual page is the check.
3. Correct anything that does not match what the page prints, then copy the
   reviewed key to `tests/extraction/<id>/expected.json`.

`corpus.test.ts` then validates that key against the extraction schema. Until a
key is copied in, its schema check is skipped and the `report.pdf` presence check
still runs.

## SCORING (for the eval runner, deferred to the spike)

No eval runner exists yet, and there is no local `ANTHROPIC_API_KEY` — the live
path (`src/lib/extract/live.ts`) is spike-validated, and the accuracy bar is a
SPEC TODO to be set after the first spike. The runner will feed each `report.pdf`
through `liveExtract` and diff the result against `expected.json`. This note fixes
the scoring shape so the spike is calibration, not design:

- **Row matching** — align result rows to expected rows by `rawName` (normalized:
  trimmed, case-insensitive). A missing expected row and an extra fabricated row
  are both failures; fabricating a row is the more serious one (FR-03: never
  invent).
- **Field comparison** — `value`, `unit`, `refLow`, `refHigh`, `rawRange` are
  compared as verbatim strings (extraction transcribes; it does not normalize).
  An omitted optional field must match an omitted expected field, not `""`.
- **`labFlags`** — compared as a set; only printed abnormal tokens count (a
  Quest `NORMAL` / a blank LabCorp flag is not a flag).
- **`lowConfidenceFields`** — NOT scored against a fixed expectation (it is the
  model's own uncertainty signal). Keys carry `[]`. Whether to reward correct
  low-confidence flags is an open question for the spike.
- **Footnotes / non-result lines** — must not appear as rows (a scenario with a
  footnote checks this directly).

Open questions for the spike: exact-string vs. tolerant numeric comparison for
`value`; how to weight a wrong `unit` vs. a wrong `value`; the pass bar itself.
