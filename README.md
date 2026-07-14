# Lab Result Explainer

Plain-language explanations of lab results — for patients, reviewed and sent by their provider. Education, never medical advice.

## Overview

A provider uploads a patient's lab report PDF. The system extracts the results (AI), the provider verifies them against the PDF, deterministic code classifies each value against the report's own printed ranges, and the AI drafts a plain-language explanation grounded only in MedlinePlus content. The provider reviews and approves, then the patient opens an emailed, DOB-gated link and reads it. It never diagnoses and never gives treatment advice — it consistently redirects to the patient's provider.

Two human gates are structural: no extracted value is used until the provider verifies it, and no text reaches a patient without provider approval. AI runs at two steps only (extract, draft); the patient page renders stored, approved content with zero AI at view time.

**v1 runs on synthetic data only — no real patient information (PHI).** Real connectivity and a real-PHI pilot are later roadmap phases. See [SPEC.md](SPEC.md).

## Status: planning — nothing is built yet

This repo currently contains only documentation. Every feature described here and in [SPEC.md](SPEC.md) is **planned, not implemented**. Phases are defined in [ROADMAP.md](ROADMAP.md).

| Phase | Delivers | Status |
|---|---|---|
| 0 — Skeleton & seam | Deployed scaffold + shared TypeScript types | Planned (v1) |
| 1 — Extraction & classification | Upload PDF → AI extract → verify → deterministic classify + golden fixtures | Planned (v1) |
| 2 — Drafting & approval | AI draft from MedlinePlus + classifications → provider approves | Planned (v1) |
| 3 — Patient side | Email link, DOB gate, results page, ask-a-question | Planned (v1) |
| 4 — Demo hardening | Broaden dictionary + corpus, polish, rehearsal | Planned (v1) |
| 5 — Real-world pilot | BAAs, real auth, one real provider | Post-course |
| 6 — Connectivity | FHIR import; lab/EHR network access | Someday |

Stack: Next.js + TypeScript + Tailwind, Supabase (DB/auth/storage), Vercel, Claude API.

## Prerequisites

- Node.js 25 (a version manager like `nvm`/`fnm` is handy; the version is pinned in
  `.nvmrc` once scaffolded — see CLAUDE.md)
- npm

## Getting started

Not yet possible — there is no application to run.
# TODO: once scaffolded: clone → install → cp .env.example .env.local → npm run dev

## Scripts

Live once the skeleton PR lands the scaffold (see CLAUDE.md Commands):

- `npm run dev` — start the local dev server
- `npm run build` — production build
- `npm start` — run the built app
- `npm run lint` — ESLint (CI fails on lint)
- `npm test` — Vitest unit tests
- `npm run test:e2e` — Playwright E2E (added in Phase 3)

## Project structure

- `SPEC.md` — product spec: features, flow, data shapes, definition of done (source of truth)
- `ROADMAP.md` — phases and their gating decisions
- `CLAUDE.md` — instructions for AI agents, code conventions, and safety/privacy rules
- `.env.example` — environment variable template

## Docs

- [Product spec](SPEC.md)
- [Roadmap](ROADMAP.md)
- [Conventions & safety rules](CLAUDE.md)

## License

No license yet — **proprietary by default**. The team chose to decide later (2026-07-08).
</content>
</invoke>
