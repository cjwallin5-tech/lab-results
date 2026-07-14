# Lab Result Explainer — Claude instructions

## Project context

Provider-facing web tool: provider uploads a lab report PDF → AI extracts the results →
provider verifies → deterministic code classifies each value against the report's printed
ranges → AI drafts a plain-language explanation grounded only in MedlinePlus text → provider
approves → patient opens an emailed, DOB-gated link and reads it. Education, never medical
advice. **Greenfield: nothing is implemented yet.** Stack: Next.js + TypeScript + Tailwind,
Supabase (DB/auth/storage), Vercel, Claude API. **v1 runs on synthetic data only — no real PHI.**

## Source of truth

- Features, flow, data shapes, definition of done: **SPEC.md** — check it before
  implementing; flag anything not in it before building.
- Phases and gating decisions: **ROADMAP.md**.
- Conventions and safety rules: this file.

## Commands

Package manager: **npm**. Commands (live once the skeleton PR lands the scaffold):
- `npm run dev` — start the local dev server
- `npm run build` — production build
- `npm start` — run the built app
- `npm run lint` — ESLint (CI fails on lint)
- `npm test` — Vitest unit tests
- `npm run test:e2e` — Playwright E2E (added in Phase 3)

## Planned structure

- `src/lib/extract/` — PDF → structured rows (calls the LLM via `src/lib/llm.ts`)
- `src/lib/llm.ts` — the **single** LLM vendor boundary; no other file calls the API
- `src/lib/analytes/` — the analyte dictionary (ids, LOINC, aliases, MedlinePlus URLs,
  curated critical/plausibility thresholds)
- `src/lib/classify/` — pure deterministic classification; no I/O, no framework imports
- `src/lib/draft/` — MedlinePlus fetch + explanation drafting; the drafting prompt lives in
  `src/lib/draft/prompt.md` — **prompt is content, not code**: versioned on its own, owned
  and edited by the Content Coordinator, never inlined as a string in pipeline code
- `tests/golden/` — golden classification fixtures; `tests/extraction/` — synthetic PDF
  corpus + expected JSON

## Safety rules — the ones that make this a health tool

Non-negotiable; these outrank convenience.

1. **AI never invents a medical fact or number.** Extraction *transcribes* what the PDF
   says — uncertain fields are marked low-confidence, never filled in. Explanation text is
   grounded only in fetched MedlinePlus content plus our classifications — never the model's
   own medical knowledge. Critical/plausibility thresholds in the dictionary are
   human-curated from cited sources only.
2. **Two human gates, no bypass.** No extracted value feeds classification until the
   provider verifies it against the PDF (FR-05). No text reaches a patient without
   `approved` status (FR-10). No code path, flag, or test shortcut may skip either gate.
3. **Classification is code, not AI** (FR-06): deterministic, pure, golden-fixture-tested.
   The LLM never decides low/normal/high, critical, or implausible.
4. **Runtime is zero-AI on the patient side.** The patient page renders stored approved
   content. No generation at view time.
5. **Synthetic data only until the Real-World Pilot phase.** Never put real patient data in
   code, fixtures, the database, or logs — and build as if it were real PHI anyway (that's
   the design habit that makes Phase 5 cheap). Lab data goes to exactly one third party:
   the LLM API at extract/draft time. Never to analytics or error tracking — scrub payloads;
   when in doubt, log the event name only. Never log share-link tokens or DOBs.
6. **Content licensing:** MedlinePlus NLM-authored pages are public domain — paraphrase
   with the "Learn more at MedlinePlus" link as attribution. **Never ingest A.D.A.M.,
   Mayo Clinic, or WebMD content** — licensed, not ours to use.
7. **Safe states render no matter what:** critical → whole report **held**, never sent to a
   patient — the provider review screen names the critical test and directs contact (FR-07), and
   no patient page can render a critical (gate test + fail-safe renderer); implausible →
   "double-check," never explained as real (FR-08); unknown test → honest fallback (FR-04);
   education-only disclaimer on every patient view (FR-12) — no code path may omit it.
8. **Language:** never "you have," no diagnosis, no medication instructions — "discuss with
   your provider" framing (FR-14).

## Code conventions

- TypeScript `strict: true`; no `any` without inline justification. ESLint + Prettier; CI
  fails on lint. Node **25** — pin it in `.nvmrc` + `package.json` `engines` + CI when
  scaffolding (25 is a non-LTS "Current" release; move to an LTS before Phase 5).
- Naming: `camelCase` vars/functions, `PascalCase` types/components, `SCREAMING_SNAKE_CASE`
  constants, `kebab-case.ts` files. Analyte ids are stable lowercase slugs (`hemoglobin`,
  `alt`) — never renamed once fixtures reference them.
- Layers: UI renders what the lib layer returns — no classification rules, medical strings,
  or LLM calls in components. All LLM traffic through `src/lib/llm.ts`.
- Validate at boundaries with zod: uploaded-file metadata, extraction output (the LLM's JSON
  is untrusted input), DOB entry. Dictionary files schema-validated in CI — malformed data
  fails the build, not the runtime.
- Errors: input problems are inline validation results, not exceptions. One row failing must
  not take down the report view — render that row in an honest error state.
- Testing: Vitest colocated `*.test.ts`; Playwright E2E. Golden suite 100% required in CI.
  E2E covers the full loop including one implausible and one unknown test, plus a held-critical
  report (held at review, never sent).

## Do not touch

- `tests/golden/*` and `tests/extraction/*` expected outputs (once created) — fixtures
  define correctness; changing them is a human product decision in a dedicated commit.
- Approved `Explanation` records — frozen; edits mean clearing approval and re-review.
- Critical/plausibility thresholds in the dictionary — change only with a human-provided
  cited source.
- `.env*` — never commit real values (API keys, Supabase secrets).

## Banned patterns

Never: skip or fake either human gate; generate patient-visible text at runtime; hardcode a
medical claim in a component; edit a fixture or E2E assertion to get green; send lab data,
tokens, or DOBs to analytics/error tracking; call the LLM outside `llm.ts`; inline prompt
text in code instead of `src/lib/draft/prompt.md`; ingest licensed medical content.

## Commits

Conventional Commits: `type(scope): summary` — feat, fix, docs, test, chore, refactor.
- `feat(extract): parse reference ranges from Quest layout`
- `docs(spec): set extraction eval accuracy bar`
