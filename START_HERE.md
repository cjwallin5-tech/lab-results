# Start here

## What we're building (30 seconds)

A doctor uploads a patient's lab report PDF. The app reads it, checks each value against
the ranges printed on the report, and drafts a plain-language explanation — using real
text from MedlinePlus (the NIH's patient-education site), not the AI's imagination. The
doctor reviews and approves it, then the patient gets an email link, confirms their date
of birth, and reads their results explained simply. They can send the office a question.

Education, never medical advice. And until the post-course pilot phase, **every patient is
fake** — we build and demo entirely on made-up people and fabricated lab PDFs.

## What changed

The old product — patients typing in their own numbers, no AI, no storage — is retired.
This is a new product: provider-facing, results pre-populated from an uploaded PDF, AI
drafts the words, the provider approves them. The Figma results page you've seen (Overall
picture + per-test cards) is still the heart of it.

## The one rule that runs through everything

**A human checks every number and every word before a patient sees it.**
The AI transcribes the PDF → the provider verifies it against the original. Code (not AI)
decides low/normal/high. The AI drafts the explanation only from MedlinePlus text → the
provider approves it. If you're ever unsure whether something needs review: it does.

## Who does what

Three tracks, working in parallel. They meet at the **shared TypeScript types** — agree on
those first, then nobody blocks anybody.

- **Logic Builder:** project skeleton + shared types (week 1 priority — it's the gate for
  everyone else), then the extraction pipeline, the classifier + golden fixtures, and the
  share-link/DOB flow.
- **Website Builder:** the provider screens (upload → verify → approve — the verify/approve
  screen needs Figma design, it's new) and the patient results page. Design keeps evolving
  in Figma as we build; all three of us weigh in there.
- **Content Coordinator (now quality owner):** the analyte dictionary (which tests we
  cover, their MedlinePlus pages), the **synthetic lab PDF corpus** (fake patients, realistic
  layouts — these double as our test suite), and reviewing the AI's draft quality against
  its sources.

Nobody owns a track exclusively — review each other's PRs, ask questions early, and small
"look what works now" demos to each other beat status meetings.

## Who does what, phase by phase

This follows the phases in [ROADMAP.md](ROADMAP.md). Each phase lists every track's
focus and what "done" looks like for them. Tasks shift between people freely — this is a
starting map, not a contract.

**Phase captains.** Each phase has one named person who keeps that phase's "done when"
list in view and says "this phase is done — next one starts" when it's met. This is so
we never half-finish a phase while half-starting the next. The captain is whoever's
track the phase centers on:
Phases 0–1 → **Logic Builder** · Phase 2 → **Content Coordinator** · Phase 3 →
**Website Builder** · Phase 4 → whoever is driving the demo rehearsals.

### Phase 0 — Skeleton & seam (~week 1)

*Goal: a deployed app shell and the shared types, so nobody blocks anybody after this week.*

- **Logic Builder** — the gate for everyone else, so this comes first: scaffold
  Next.js + TypeScript + Tailwind, connect Supabase, deploy to Vercel, set up CI
  (lint + test). Draft the **shared types** from SPEC's data model and get both
  teammates to sign off on them in the PR — that review *is* the design meeting.
  Write the seed script (demo provider + 2–3 synthetic patients).
- **Website Builder** — Figma the missing screen: verify/approve (S3) — it's the one screen
  the old design set doesn't cover. Meanwhile build the upload page (S2) against mocked
  types as soon as the types PR lands.
- **Content Coordinator** — fabricate the first 3 synthetic lab PDFs: one normal panel, one
  with a critical value, one containing a test we don't cover. Make them look like real
  Quest/LabCorp printouts (different layouts on purpose). Start the analyte dictionary:
  pick the ~15 most common blood tests, find each one's MedlinePlus test page and LOINC code.

**Phase done for you when:** app deploys and runs locally for all three (Logic), upload page
renders against mock data + S3 designed (Website), 3 PDFs exist + dictionary started (Content).

### Phase 1 — Extraction & classification (the trust core)

*Goal: upload a synthetic PDF → provider-verified, correctly classified results.*

- **Logic Builder** — the extraction spike: PDF → structured JSON through `llm.ts`; zod-validate
  the model's output (treat it as untrusted input). Then the deterministic classifier with
  **golden fixtures first, code second** — write the fixture cases (below/in/above, one-sided
  ranges, critical, implausible, unknown) before implementing. Wire extraction → dictionary
  matching → classification into one pipeline with report statuses.
- **Website Builder** — build the verify screen (S3, first half): PDF on one side, editable
  extracted table on the other, confirm button that advances the report status. Start with
  mocked extraction output; swap in the real pipeline when Logic's spike lands. Handle the
  ugly cases honestly: low-confidence fields, unknown tests, a row the provider deletes.
- **Content Coordinator** — turn the PDF corpus into the **eval set**: for each synthetic PDF,
  write the expected JSON (every test, value, unit, range) by hand. That's the answer key
  extraction is graded against. Grow the corpus with harder layouts (two-column, scanned-look,
  multi-page). Help set the extraction accuracy bar from the first spike results (SPEC TODO).

**Phase done for you when:** golden suite passes 100% (Logic), a provider can upload → verify
→ see classified rows on screen (Website), eval set covers every PDF and the accuracy bar is
agreed (Content).

### Phase 2 — Drafting & approval (the safety core)

*Goal: verified results become an AI-drafted, provider-approved patient page.*

- **Logic Builder** — MedlinePlus integration: LOINC → test-page text (MedlinePlus Connect),
  cached per analyte. The drafting call: classifications + source text in, Overall picture +
  per-test text + sources out — through `llm.ts`, zod-validated. Approval state machine:
  draft → approved, approved text frozen. Write the gate test: no route ever returns
  unapproved text.
- **Website Builder** — the review/approve screen (S3, second half): show the drafted page
  as the patient will see it, let the provider edit the text inline, approve button. This
  screen carries the product's safety story — make the "you are approving what your patient
  will read" framing unmistakable.
- **Content Coordinator** — your phase. Own the **prompt** — the instructions the app sends
  the AI when drafting. It lives in its own file (`src/lib/draft/prompt.md`), not inside the
  pipeline code, so you edit and PR it directly like any document. Iterate it until drafts
  are faithful to MedlinePlus, plain-language (aim ~8th-grade reading level), and match the
  tone in the Figma copy ("Yours is a little above the typical range…"). Review every draft the
  pipeline produces against its sources — you're checking for invented claims, wrong
  emphasis, and diagnosis-flavored language (the FR-14 rules). File what you find as
  fixture-worthy cases.

**Phase done for you when:** gate test green + drafts generate reliably (Logic), a provider
can read/edit/approve end-to-end (Website), you'd let a stranger's parent read the drafts
without wincing (Content).

### Phase 3 — Patient side (the loop closes)

*Goal: the full journey — upload to patient reading to question sent.*

- **Logic Builder** — share links: unguessable token, expiry, DOB gate, one report per link;
  email sending (link email + ask-a-question email to the office address). Don't log tokens
  or DOBs. Then the full E2E test: upload → verify → approve → email → DOB → read → ask.
- **Website Builder** — the patient-facing screens, built from the existing Figma: DOB gate
  (S1), the results page (S4 — overall box, range markers, per-test cards, MedlinePlus links,
  disclaimer, plus the critical / implausible / unknown states), ask-a-question (S5).
- **Content Coordinator** — walk the whole flow as each of your synthetic patients and audit
  every word on every screen: disclaimer present everywhere, critical callout reads urgent
  but not terrifying, unknown-test fallback is honest, no "you have" language anywhere.
  Draft the standing UI copy (disclaimers, error states, email text) — that's people-facing
  writing, and it's yours.

**Phase done for you when:** E2E passes including the critical/implausible/unknown patients
(Logic), all five screens live (Website), the copy audit is clean (Content).

### Phase 4 — Demo hardening

*Goal: a demo the team can run cold, twice, without touching code.*

- **Logic Builder** — fix what the rehearsals shake out; make the seed script rebuild the
  full demo state in one command; error handling for the embarrassing cases (bad PDF, expired
  link, wrong DOB three times).
- **Website Builder** — polish pass: loading/empty states, mobile check on the patient page
  (patients open email links on phones), print styles if time allows.
- **Content Coordinator** — broaden the dictionary and corpus to whatever the demo story
  needs; write the demo script (which synthetic patient shows off which feature); run the
  rehearsals and keep the punch list.

**Phase done when:** two clean cold runs of the demo, by different drivers.

### If the load feels uneven — rebalance moves

The tracks are sized against the work, not the people, and Logic Builder carries roughly
half the build. **Checkpoint at the end of Phase 1:** by then everyone's real pace is
known — look at the map again together. Pre-agreed moves if Logic (or anyone) is
overloaded, in order:

1. **Share-link + email flow → Website Builder** (Phase 3). Self-contained Next.js
   route-handler work, and it lands exactly when Logic is most stretched.
2. **Dictionary data files → Content Coordinator, written as code.** They're typed,
   schema-validated data entries — a gentle on-ramp to direct code contributions.
3. **E2E test authorship → Website Builder** — they know the screens best anyway.

And beyond these: shift any task whenever it helps — just say so, so that the map
stays true.

### Phases 5–6 — after the course

Real-PHI pilot and EHR connectivity. Deliberately not planned at task level yet — the
gating decisions are listed in [ROADMAP.md](ROADMAP.md). Expect the tracks to blur here:
Phase 5 is mostly vendor/compliance work (everyone), Phase 6 is mostly Logic. Plan it when
Phase 4 ends.

## Where things live

- What exactly are we building? → [SPEC.md](SPEC.md)
- What order, and when is it done? → [ROADMAP.md](ROADMAP.md)
- Rules for code and safety (Claude reads this every session) → [CLAUDE.md](CLAUDE.md)
- Screens → figma-screens.png / the Figma file
