# Lab Result Explainer

A website where someone types in their blood-test results and gets a plain-language, human-reviewed explanation of each one: what the test measures, and whether their number is low, normal, high, or something to call a doctor about. Educational information only, never medical advice. Nothing the user enters is stored or sent anywhere.

## Quickstart

```bash
git clone git@github.com:cjwallin5-tech/lab-results.git
cd lab-results
npm ci
npm run dev
```

Open http://localhost:3000.

## Status

Phase 0 (skeleton and automated checks). The product itself, the entry form and the explanations, is Phase 1 work. See [ROADMAP.md](ROADMAP.md) for phases, [SPEC.md](SPEC.md) for the intended behavior and data model, and [START_HERE.md](START_HERE.md) for how the team works and how v1 gets built.

## Tech stack

- Next.js 16 (App Router) with TypeScript and Tailwind CSS 4
- Vitest for unit tests
- Hosted on Vercel (planned)
- Node 24, npm

No database and no environment variables in v1: curated data ships as versioned files in the repo, and user input lives only in browser session state.

## Commands

```bash
npm run dev           # start the dev server
npm run build         # production build
npm run lint          # ESLint
npm run typecheck     # TypeScript, no emit
npm run test          # Vitest unit tests
npm run golden        # golden classification suite (fixtures arrive with Phase 1)
npm run content-gate  # fails if any content entry lacks a human reviewer (FR-13)
npm run check         # all of the above except build
```

CI (GitHub Actions) runs lint, typecheck, tests, both gates, and the build on every push to main and every pull request.

## Project structure

```
src/app/          Next.js pages and layout
src/lib/model/    the three shared data shapes from SPEC.md (Analyte, ContentEntry, UserResult)
src/data/         curated analyte facts and human-reviewed content entries (JSON, versioned)
scripts/          the golden-suite runner and the content-review gate
tests/            unit tests; tests/golden/ holds the golden fixtures
prototype/        the original paste-and-parse prototype, archived as reference
.github/          CI workflow
```

## Contributing

Work happens on short-lived feature branches with pull requests reviewed by a teammate; nothing merges red. Two rules carry the safety model: every user-facing medical text needs a named human reviewer before it ships, and golden fixtures are never edited to make a failing implementation pass.
