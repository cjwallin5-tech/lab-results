# Extraction eval corpus

Synthetic lab PDFs + hand-written answer keys. This is what extraction accuracy
(SPEC.md "Definition of done" #2) is graded against — not a functional test of the
pipeline itself (that lands with `src/lib/extract/` in Phase 1), just the fixed target it
must hit.

## Layout

```
tests/extraction/
  pdfs/<name>.pdf        — synthetic report, varied layout/vendor style
  expected/<name>.json   — hand-authored ExtractedRow[] (src/lib/types) answer key
```

Every `pdfs/<name>.pdf` must have exactly one `expected/<name>.json` — enforced by
`expected.test.ts`.

## What the answer key represents

Each `expected/*.json` is the ground-truth transcription of every test row on that
report: `rawName`, `value`, `unit`, `refLow`/`refHigh`, `rawRange`, `labFlags` — exactly
as printed on the PDF, never normalized or corrected. `lowConfidenceFields` is always
`[]` in the answer key (the author isn't uncertain about anything); a real extractor's
output will populate it per SPEC's low-confidence rule.

This is the transcription layer only. It does **not** encode analyte-dictionary
matching, classification, or critical/implausible status — those are downstream of
extraction and covered separately by `tests/golden/`.

## Corpus (grows over time — see corpus notes below)

| File | Layout stress-test | Notable cases |
|---|---|---|
| `01-normal-cbc.pdf` | clean single-column | baseline, all-normal |
| `02-critical-cbc.pdf` | legacy monospace/dot-matrix printout, ALL CAPS | critical flag (`CRIT L`), combined multi-token flag |
| `03-fabricated-test.pdf` | clean single-column | one test (EGR) with no dictionary entry — not-covered case |
| `04-two-column-lipid-liver.pdf` | two side-by-side panels on one page | column-attribution risk (which range belongs to which column) |
| `05-scanned-bmp.pdf` | rotated, low-contrast, noise-textured scan look | degraded-image reading, not clean vector text |
| `06-multipage-annual-panel.pdf` | 2 pages, 4 panels | page-break continuity, repeated/partial header on page 2 |

Each report also exercises at least one one-sided range (`< 200`, `> 40`) except where
noted, since a one-sided printed range is a common real-world case the extractor must
carry through as `refLow` **or** `refHigh` with the other left `undefined` — never
guessed.

## Growing the corpus

Add a new `pdfs/<name>.pdf` + hand-write its `expected/<name>.json` in the same PR.
Favor layouts that stress a *different* extraction failure mode than what's already
covered (handwritten annotations, watermarks, non-English units, a second unknown test,
a row split across a page break mid-table, etc.) over more of the same shape.

**Known gap (see `SPIKE_RESULTS.md`):** `05-scanned-bmp.pdf` looks scanned but still
carries a real text layer (it's a styled HTML page printed to PDF, not a flattened
image). The corpus has no fixture that is a genuine rasterized image with **no text
layer** — the case that forces true OCR/vision reading with nothing to fall back on.
Add one (render a page to an image and embed only the image, no text) and re-run the
spike before treating the accuracy bar as validated for real scanned intake.

## Fixture governance

Per CLAUDE.md "Do not touch": once merged, an `expected/*.json` file defines
correctness. Changing one — including to make a failing extractor pass — is a human
product decision made in its own dedicated commit, not a side effect of pipeline work.
