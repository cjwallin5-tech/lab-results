# Lab Result Explainer — ROADMAP

> The whole-project map: what each phase delivers and when it's done. It is *not* a build
> plan — each piece of work gets its own plan when we start it. How we begin is in
> [START_HERE.md](START_HERE.md); what we're building is in [SPEC.md](SPEC.md).

**Context:** course project, built to be genuinely usable. Phases 0–4 happen during the
course on synthetic data. Phases 5–6 are the post-course path to real use — kept thin here
on purpose, but their gating decisions are listed so nothing is hidden.

TODO: add the course demo date once known — it sets the pace for Phases 0–4.

---

## Phase 0 — Skeleton & seam (~week 1)

**Delivers:** a deployed hello-world app and the shared contract everyone builds against.

- Next.js + TypeScript + Tailwind scaffold; Supabase project; Vercel deploy; CI (lint, test).
- **Shared TypeScript types** from SPEC's data model — the seam that lets all three
  tracks work in parallel.
- Seed script: demo provider account + 2–3 synthetic patients.

**Done when:** app deploys, CI runs, types merged, everyone can run it locally.

## Phase 1 — Extraction & classification (the trust core)

**Delivers:** upload a synthetic lab PDF → verified, classified results.

- Claude extraction (`llm.ts` boundary) → structured rows; analyte dictionary (~15–20
  common tests to start) with LOINC + aliases.
- Provider verify screen (side-by-side PDF vs editable table).
- Deterministic classifier + **golden fixtures** (below/in/above, one-sided, critical,
  implausible, unknown).
- Synthetic PDF corpus (varied layouts) doubling as the extraction eval set.

**Done when:** golden suite passes 100%; extraction eval bar set and met; a provider can
upload → verify → see classified rows.

## Phase 2 — Drafting & approval (the safety core)

**Delivers:** the AI-written, provider-approved patient page content.

- MedlinePlus fetch per analyte (LOINC → test page text; MedlinePlus Connect).
- One-call draft: Overall picture + per-test "What this means," sources included.
- Provider review screen: edit + approve; approved text stored and frozen. A report with a
  critical result is **held** here instead — no draft, nothing sent; the screen names the critical
  test and directs the office to contact the patient (FR-07).
- Gate test: nothing renders unapproved text; a critical report can't produce a patient page.

**Done when:** a verified report becomes an approved patient page with every claim traceable
to MedlinePlus or a classification.

## Phase 3 — Patient side (the loop closes)

**Delivers:** the end-to-end demo path.

- Email share link (token, expiry) + DOB gate (S1).
- Patient results page (S4): overall box, range markers, per-test text, MedlinePlus links,
  disclaimer, implausible/unknown states. (Critical never reaches the patient page — held at
  review; see Phase 2 / FR-07.)
- Ask-a-question → office email (S5).

**Done when:** the full E2E test passes: upload → verify → approve → email → DOB → read → ask.

## Phase 4 — Demo hardening

**Delivers:** a demo that doesn't wobble.

- Broaden the analyte dictionary + synthetic corpus; polish states; empty/error handling;
  print styles (stretch); demo script + rehearsal with the 3 seed patients.

**Done when:** the team can run the demo cold, twice, without touching the code.

---

## Phase 5 — Real-world pilot (post-course; thin by design)

**Delivers:** one real provider using it with real patients.

Gating decisions to make then (listed now so they're visible):
- **BAAs everywhere:** Vercel HIPAA tier; DB vendor call — Supabase HIPAA (~$599/mo floor)
  vs migrate to Neon Scale / AWS / GCP (free BAA); Claude via **AWS Bedrock** (same model,
  AWS BAA) or Anthropic ZDR arrangement.
- Real provider auth (multi-account), audit logging, link/token policy review.
- Ask-a-question switches to **notify-only** email (no PHI in email bodies).
- Legal review of disclaimer + terms; security pass; clinician review of critical thresholds.
- Pilot provider recruited; patient-volume data gathered.

## Phase 6 — Connectivity (someday)

**Delivers:** results arrive without upload.

- FHIR import (`Observation` / `DiagnosticReport`) — the data model already maps.
- Lab/EHR network access (Epic, Redox, Particle, Health Gorilla) — the approvals-heavy
  path we deliberately deferred. Decide vendor when Phase 5 proves demand.
