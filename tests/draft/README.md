# Drafting prompt review corpus

Supports `src/lib/draft/prompt.md` (owned by the Content Coordinator per CLAUDE.md).
Unlike `tests/extraction/`, this is not a CI-enforced fixture set — there's no
`src/lib/draft/` pipeline code yet to run it against automatically. It exists so prompt
iteration has real inputs, real MedlinePlus grounding, and a written record of what was
reviewed and why, instead of re-deriving all of that from scratch on every edit.

## Layout

```
tests/draft/
  sources/<analyteId>.md     — cited, paraphrased MedlinePlus excerpts (dated fetch)
  scenarios/<name>.json      — hand-built classified-row inputs for the prompt
  outputs/<name>.json        — frozen draft output from the last full review (see REVIEW.md)
  REVIEW.md                  — what was reviewed, what was found, what changed in prompt.md
```

## Using this to iterate the prompt

1. Edit `prompt.md`.
2. Re-run the scenarios (a fresh agent given `prompt.md` + one `scenarios/*.json`, no
   other context — see REVIEW.md "Findings" for the method) and diff against
   `outputs/*.json`.
3. Review the new output against `sources/*.md` for invented claims, wrong emphasis, or
   diagnosis-flavored language (FR-14) — same three things every time.
4. If the new output is better, replace the matching `outputs/*.json` and add a dated
   note to `REVIEW.md`. Don't silently overwrite `outputs/*.json` without updating
   `REVIEW.md` — the record of *why* a version was accepted is the point, not just the
   final text.

## Growing this corpus

Add a `scenarios/<name>.json` for anything not yet covered — see REVIEW.md "What this
review did not cover" for known gaps (a mixed above+below report, multi-round
consistency). Reuse `sources/<analyteId>.md` where the analyte already has one; add a
new one (with its MedlinePlus URL and fetch date) when it doesn't.

## Fixture governance

Same rule as `tests/extraction/`: once a scenario or output is reviewed and merged,
changing it — including to make a prompt edit look better than it is — is a decision
made in its own commit, with the reasoning in `REVIEW.md`, not a silent overwrite.
