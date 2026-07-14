# Lab Result Explainer

Plain-language explanations of lab results, reviewed and sent by the patient's provider. Education, never medical advice.

## Overview

A provider signs in, opens a patient's lab report, and the system transcribes the results (AI). The provider verifies them, deterministic code classifies each value against the report's own printed ranges, and the AI drafts a plain-language explanation grounded only in MedlinePlus content plus those classifications. The provider reviews and approves, then the patient opens a date-of-birth-gated link and reads it. It never diagnoses and never gives treatment advice; it consistently redirects to the patient's provider.

Two human gates are structural: no extracted value is used until the provider verifies it, and no text reaches a patient without provider approval. AI runs at two steps only (extract, draft); the patient page renders stored, approved content with zero AI at view time.

**v1 runs on synthetic data only, with no real patient information (PHI).** Real connectivity and a real-PHI pilot are later roadmap phases. See [SPEC.md](SPEC.md).

## Status: runnable on synthetic data

The full provider-to-patient loop runs locally on synthetic data with no external credentials. External services (Supabase, the Claude API via the AI Gateway, transactional email, live MedlinePlus fetch) sit behind seams and are activated by setting their environment variables.

| Phase | Delivers | Status |
|---|---|---|
| 0 Skeleton and seam | Scaffold plus shared TypeScript model | Built |
| 1 Extraction and classification | Read, verify, deterministic classify plus golden fixtures | Built (offline; live extraction gated on a key) |
| 2 Drafting and approval | Draft from MedlinePlus plus classifications, provider approves | Built (offline; live drafting gated on a key) |
| 3 Patient side | Share link, DOB gate, results page, ask a question | Built |
| 4 Demo hardening | Broaden dictionary and corpus, polish, rehearsal | In progress |
| 5 Real-world pilot | BAAs, real auth, one real provider | Post-course |
| 6 Connectivity | FHIR import, lab/EHR network access | Someday |

What is genuinely done versus a synthetic stand-in:

- The deterministic classifier is real and covered by a golden suite.
- Both human gates and the DOB gate are enforced server-side.
- Extraction and drafting run from pre-authored synthetic fixtures when no API key is set. In that offline mode the extraction-accuracy eval and MedlinePlus-grounding checks are not measured, never reported as passing. The live path via the AI Gateway is written but is exercised only with a key.
- Critical and plausibility thresholds in the dictionary are labeled demo values, not clinician-approved. They must be replaced with clinician-signed, cited thresholds before any real use.

Stack: Next.js 16 (App Router) with TypeScript and Tailwind v4, a file-backed local store (Supabase adapter deferred to the pilot), the Vercel AI SDK for the gated live LLM path.

## Prerequisites

- Node.js 20.9 or newer (this build runs on Node 24)
- npm

## Getting started

```bash
git clone <repo-url>
cd lab-results
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:3000`). No `.env` is needed for the synthetic demo; the demo provider credentials are pre-filled on the sign-in screen.

### Demo walkthrough

1. Sign in as the demo provider (credentials are pre-filled).
2. Open a seed report, click Read the results, verify the extracted table, and confirm.
3. Review the drafted explanation and Approve, then Send to the patient.
4. Open the patient link. Confirm the patient's date of birth to read the results, then try Ask a question.

Seed patients and their dates of birth: Maria Alvarez (1984-03-12), David Chen (1971-11-02, includes a critical result), Grace Okoro (1990-07-25, includes an implausible and a not-covered test).

## Scripts

- `npm run dev` starts the local dev server
- `npm run build` makes a production build
- `npm start` runs the built app
- `npm run lint` runs ESLint (CI fails on lint)
- `npm test` runs the Vitest unit suite
- `npm run golden` runs the golden classification suite
- `npm run validate-dictionary` validates the analyte dictionary against its schema
- `npm run test:e2e` runs the Playwright full-loop test (starts its own server)
- `npm run check` runs lint, typecheck, unit tests, golden, and dictionary validation

## Project structure

- `src/lib/model` the shared data model and zod schemas (the contract every layer builds against)
- `src/lib/classify` the pure deterministic classifier
- `src/lib/analytes` the curated dictionary loader and schema; data in `src/data/analytes`
- `src/lib/llm.ts` the single LLM boundary; offline fixtures in `src/data/seed`, prompts in `src/lib/draft/prompt.md` and `src/lib/llm/extract-prompt.md`
- `src/lib/db` the repository interface and local adapter; `src/lib/report/status.ts` the status machine
- `src/app/provider` the provider workflow; `src/app/r/[token]` the patient share flow
- `src/components/ui` design-system primitives; `src/components/provider` and `src/components/patient` feature components
- `tests/golden`, `tests/dictionary`, `tests/e2e` the test suites

## Docs

- [Start here](START_HERE.md)
- [Product spec](SPEC.md)
- [Roadmap](ROADMAP.md)
- [Conventions and safety rules](CLAUDE.md)

## License

No license yet; proprietary by default. The team chose to decide later (2026-07-08).
