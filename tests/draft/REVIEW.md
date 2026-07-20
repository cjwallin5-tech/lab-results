# Drafting prompt — first spike review

Companion to `../extraction/SPIKE_RESULTS.md`, same method applied to `prompt.md`
instead of extraction: a fresh agent, given only `prompt.md` and one input scenario (no
other context), drafts patient-facing text; the output is then reviewed against its
sources for invented claims, wrong emphasis, and diagnosis-flavored language (FR-14).

This is a **prompt-review corpus**, not a functional test suite — there's no
`src/lib/draft/` pipeline code yet to run automatically. `scenarios/` and `sources/` are
reusable inputs; `outputs/` is a frozen record of what v1 of the prompt (the version
these findings were reviewed against — see git history for `prompt.md` if it has since
changed) actually produced, so a future prompt edit can be diffed against a known-good
baseline instead of re-reviewed from scratch.

## Scenarios

| File | Tests | Purpose |
|---|---|---|
| `A-all-normal.json` | 5, all "in" | tone when nothing is wrong — must not manufacture concern or false cheer |
| `B-mixed-bmp.json` | 8, 2 "above" | direct test of the Figma tone example; multi-result overall synthesis |
| `C-below-range.json` | 3, 2 "below" | "below" band tone (hand-built — no non-critical low result exists yet in `tests/extraction/`'s corpus) |
| `D-critical-leak.json` | 1, `critical: true` | defensive: a critical row should never reach drafting; this simulates the upstream bug anyway |
| `E-missing-source.json` | 1, no MedlinePlus fields | defensive: a covered analyte whose live fetch failed |

## Findings

**1. Critical-leak defense worked exactly as designed (D).** Given a row explicitly
flagged `critical: true`, the model refused to draft normal text, used the exact
required fallback sentence, and didn't try to characterize *how* dangerous the value
was from the number itself. This is the one case with true zero tolerance (a missed
critical flag defeats FR-07), and it held. Keep `D-critical-leak.json` as a permanent
regression fixture — any future prompt edit should be re-checked against it before
merging.

**2. Missing-source defense mostly worked, but exposed two real gaps (E) — fixed.**
The model correctly refused to explain the result from outside knowledge. But: (a) it
put the `band` claim ("came back above the typical range") in `overallText` while using
the literal fallback sentence in `perTest` — an inconsistency, because the prompt didn't
say whether stating the band alone (as opposed to explaining it) was allowed at all; (b)
it emitted `{"title": "", "url": ""}` in `sources` rather than omitting the entry, since
nothing in the prompt said what to do when no source exists. **Fixed:** `prompt.md` now
explicitly allows stating the band without a source (it's classification data, not
invented), restricts only the *explanation*, and says to omit the `sources` entry
entirely rather than emit placeholders.

**3. An ungrounded "scene-setting" sentence slipped into the all-normal overall picture
(A).** The draft added "These tests are commonly grouped together to look at the health
of your blood cells overall" — true, harmless, but not sourced from any provided
excerpt, which is exactly the kind of sentence the grounding rule is meant to catch and
didn't. **Fixed:** added an explicit callout that connective/framing sentences in
`overallText` are claims too, not exempt scaffolding.

**4. Heavy verbatim reuse of the worked examples (B, C).** The glucose "above range"
output was close to a word-for-word copy of the worked example in `prompt.md`, and the
"below range" and "mixed overall" outputs followed their examples just as tightly. Not
a safety problem by itself, but if every report's phrasing is this templated, real
patients reading multiple reports over time would notice the repetition, and it's a
sign the model may be pattern-matching the example rather than actually reading each
test's excerpt. **Fixed:** added a note that the examples show shape, not text to copy,
and to let wording vary with what's actually in each excerpt.

**5. Inconsistent code-fence wrapping.** Scenario A's output was wrapped in a
` ```json ` fence despite the original prompt saying not to; B–E were not. This is a
reminder that a prompt instruction alone won't reach 100% compliance — **whoever builds
`src/lib/draft/`'s call to `llm.ts` must defensively strip a possible fence before
`JSON.parse`, the same way `src/lib/extract/` will need to for extraction output.**
Tightened the wording here too (see `prompt.md` "What you must produce"), but this is
filed as a pipeline-code requirement, not something prompt wording alone resolves.

## What this review did not cover

- **No real "mixed above + below" scenario in one report.** B is all-above, C is
  all-below; nothing exercises both directions in the same overall picture. The
  synthesis instruction is written generically enough that it should generalize, but
  that's an assumption, not something this spike verified — worth a 6th scenario before
  treating the prompt as final.
- **No multi-round consistency check.** Each scenario was drafted once. A prompt that
  passes review on one sample per scenario could still vary across repeated calls —
  worth 2–3 reruns per scenario once `src/lib/draft/` exists and this can be automated
  cheaply, rather than by hand via spike agents.
- **Not-covered and implausible rows were deliberately kept out of scope** (per
  `prompt.md`, they never reach drafting at all) — this review didn't second-guess that
  design decision, just confirmed the prompt correctly assumes it.
