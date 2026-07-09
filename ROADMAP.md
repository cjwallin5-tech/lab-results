# Roadmap — what we build, in what order

> **How to read this:** this is the **map** — plain words, for the whole team, on *what* each
> phase delivers and *when*. It is **not** a build plan. How we begin and work together is in
> [START_HERE.md](START_HERE.md); the exact features live in [SPEC.md](SPEC.md); and *how* to
> implement a specific piece is worked out per-task when you build it (plan mode or a scratch
> plan), not here.
>
> A living document, not a contract. Phases get fleshed out once their direction is locked —
> near phases and any phase whose product intent is settled are detailed; the rest stay thin
> (direction, not plans). Phase numbers match SPEC.md and the ADRs. Status: **now** · **next** ·
> **later** · **done**

## The three layers (so this doc doesn't try to be all of them)

- **This roadmap** — the map. What/when across the whole project. Changes rarely.
- **START_HERE.md** — the on-ramp. How we work, and how we build v1.
- **Per-task plans** (plan mode or a scratch note) — how to build one specific piece. Made
  fresh when you start the work, thrown away after. Not committed as long-lived docs.

---

## Phase 0 — Decisions & foundations · **now**

**Delivers:** an empty-but-running app with our safety checks wired in, and every blocking
decision made — so the team can build v1 without tripping over unmade choices.

**In scope:**
- The blocking decisions — now made: how explanations are made (hand-written, human-reviewed),
  the tech stack (Next.js + TypeScript + Tailwind), hosting (Vercel), the data shapes
  (SPEC.md Data model), and content roles (clinician secured). One small confirmation
  remains: the clinician's name/commitment.
- The project skeleton — a running Next.js app (one person's job; see START_HERE).
- The automated checks on every change: lint, tests, the golden-suite runner, and the
  content-review gate (can start as stubs).
- Kick off the long-lead human work now — it gates Phase 1, not this phase: sourcing the cited
  numbers, and confirming the clinician.

**Done when:**
- [x] Blocking decisions recorded (explanation engine accepted; stack, hosting direction, data shapes,
  content roles settled — 2026-07-08).
- [ ] `dev` / `test` / `lint` / `build` commands exist and pass.
- [ ] The checks run automatically on every change.

## Phase 1 — The explainer (v1) · **next**

**Delivers:** the actual product — someone types their results anonymously and reads
human-reviewed, plain-language explanations, with the safety behaviors for dangerous,
impossible, and uncovered values. Nothing stored, nothing sent anywhere.

**How the work splits:** three parallel tracks, one per person, on disjoint parts of the code
so branches merge cleanly. The full "who does what and how we work" is in START_HERE.md — here
is just the shape:

- **Classification engine** — the code that judges each value (units, ranges, dangerous /
  impossible). Proven by the golden suite (a fixed answer key it must score 100% on).
- **Product UI** — the entry form, the results page, and the four special states (danger
  banner, double-check prompt, "we don't cover this," ever-present disclaimer). Proven by the
  end-to-end "robot user" test.
- **Content library** — the ~40–60 written, sourced, human-reviewed explanations. Longest lead
  time; starts earliest.

**Done when** (this is SPEC.md's Definition of done):
- [ ] The golden suite passes 100% automatically.
- [ ] The end-to-end test covers the core flow, including one dangerous, one impossible, and
  one uncovered test.
- [ ] Every explanation has a named reviewer (enforced by the build).
- [ ] No lab value is ever stored or sent to a third party (FR-15/FR-16).
- [ ] The clinician has reviewed the library — required before *public launch*; may finish
  after dev is done.

## Phase 2 — Accounts, history & portal import · **later**

*Detailed now (not just direction): the product intent is locked — **providers dispatch login
links to their patients, who log in and see saved results**. That combines Phase-2 storage with
Phase-3 provider involvement, so the two plan together and the HIPAA floor below applies from the
first patient record stored.*

**Would deliver:** patients log in (by clinic invitation only — no open signup), see their
results over time, and optionally import them automatically from their patient portal instead
of typing.

**Stack:** **Vercel** for the app host (settled). **Database + auth: still being chosen** —
Supabase (Postgres + auth in one) was the frontrunner, but its HIPAA tier (~$599/mo) has us
weighing cheaper BAA-capable options; the vendor choice doesn't change the mechanics below (any
Postgres + auth provider works). Phase 2 is also the natural home for **sex-specific reference
ranges** (v1 uses combined adult ranges; the range-resolver makes this a contained upgrade).

> ⚠️ **The v1 "nothing is stored" promise ends here, by design.** FR-15/16 are v1-only. This
> product stores lab values, ranges, names, and patient↔provider links on the server. Everything
> below is what that requires.

### Decision 1 — Data-flow policy (write down what's stored and what leaves)

The question is no longer *whether* to store (logins settle that) — it's writing the policy down.

- **What's stored** (all PHI, on the chosen Postgres database): lab values, ranges, test names,
  patient name/email, provider identity, patient↔provider mapping, timestamps, viewed-status.
- **What crosses to a third party** — each vendor in the path needs a BAA (see Decision 2):
  the database/auth vendor (storage), the email/link sender, the host (Vercel).
- **Rule to set:** invitation/login emails carry **no lab data** — only an opaque one-time
  token. Keep v1's PHI-scrubbing on any analytics/error tracking. **No runtime AI** (current
  explanation-engine decision still holds).
- **Required from you:** a written data map (the list above), the vendor list, and the
  "emails contain no PHI" rule — recorded before the first line of storage code.

### Decision 2 — PHI-grade handling (NFR-01, and full HIPAA because providers are involved)

- **Encryption:** at rest + in transit (TLS) — provided by any HIPAA-capable host/database.
- **Access control:** **Row-Level Security** (a Postgres feature — Supabase, Neon, RDS all have
  it) — a patient sees only their own results, a provider only their patients'. This is a design
  task, not a default; get the rules right.
- **Auth security:** decide MFA and password policy (most auth providers support both).
- **Retention & deletion:** decide how long records are kept and the patient/provider-initiated
  delete path. *Pick an actual value.*
- **Audit logging:** record who released/viewed what, and when — required as a formal HIPAA
  audit control once providers are on.
- **Breach/incident:** the **FTC Health Breach Notification Rule** applies to health apps, and
  the **HIPAA Breach Notification Rule** applies once providers (covered entities) are involved —
  you need an incident-response plan.
- **Cost floor (this is what reopened the vendor choice):** the BAA is the price driver, not the
  database. Some vendors gate it behind pricey tiers — e.g. Supabase's HIPAA add-on needs at least
  the **Team plan (~$599/mo)** — while others (AWS/GCP) sign a BAA for free and charge only for
  usage. Budget the BAA as the real cost of storing patient data.
- **⚠️ Get a professional here.** Providers are covered entities and you are their *Business
  Associate*. That almost certainly means a real HIPAA program — risk assessment, written
  policies, a designated security officer, workforce training, and signed BAAs with every vendor.
  This is lawyer/compliance-pro territory, not something to infer from this doc.
- **Required from you:** a retention value, the RLS access rules, an MFA decision, a vendor-BAA
  checklist, and a compliance professional engaged before launch.

### Decision 3 — FHIR import (optional; the heaviest lift)

- **Scope call first:** accounts + saved history work *without* this. It's a convenience feature —
  recommend deferring it to a later Phase-2 increment rather than the first release.
- **If in:** pick target portals (Epic/MyChart, Oracle Health), register as a **SMART on FHIR**
  app per vendor, and use patient-authorized OAuth to read their results (FHIR `Observation` /
  `DiagnosticReport`). Data flows portal → your server, so it lives under the Decision-1 map.
- **Reuse the confirmation-screen pattern** from the deferred-PDF decision: imported values are a
  *draft the patient confirms*, never trusted silently.
- **Required from you:** an in-or-out call for the first release; if in, the target portal list.

**How the work splits:** the same three people, but **less disjoint than Phase 1** — every track
now touches one shared database/auth layer, so expect more coordination (agree the schema together
first, like the data shapes in Phase 1). The three roles evolve:

- **Data & security** *(was Classification engine)* — the new "brain": the database schema for
  accounts / results / history, **Row-Level Security** policies (a patient reads only their own
  rows, a provider only their patients'), auth config (MFA, password policy), and the
  range-resolver upgrade for sex-specific ranges. Correctness-and-safety core, like the classifier
  was. *Stack: the chosen Postgres + auth provider, with Row-Level Security.*
- **Product UI** *(unchanged owner)* — the new screens: login / invitation, results-over-time
  (history), the provider dispatch view, and — if FHIR is in — the import confirmation screen.
  *Stack: Next.js on Vercel, reading the database/auth provider through the RLS rules above.*
- **Content & compliance** *(was Content library)* — the v1 library is built, so this track pivots
  to **sourcing sex-specific ranges** (new cited numbers; clinician sign-off on any new criticals)
  and **coordinating the policy artifacts** — privacy policy, consent flows, data map, retention
  policy — plus driving the compliance-professional engagement. Same coordinator instinct, aimed
  at compliance instead of writing.

*The HIPAA program itself (BAAs, risk assessment, security officer, training) rides alongside all
three as a professional engagement — it's not one person's coding task.*

> **Watch the load on the third track.** Compliance coordination is really a *fourth* workstream
> wearing the Content coordinator's hat. If it turns heavy, rebalance — hand the sex-specific
> range sourcing to someone else, or split compliance out on its own — rather than quietly
> overloading one person.

**How the stack plays in, in one line:** the **database/auth provider** (being chosen) is the
data/auth/access-control spine (Postgres stores it, its auth logs people in, Row-Level Security
keeps patients and providers in their own lane); **Vercel** hosts the Next.js app that renders it;
a separate **email vendor** sends invitation links (token only, never PHI). Each is a PHI-path
vendor, so each needs a signed BAA before real patient data flows.

**Done when:**
- [ ] A patient can log in **by invitation only** (no open signup) and see **only their own**
  results — RLS enforced *and* tested.
- [ ] A provider can dispatch results to a patient and see who has viewed what.
- [ ] Results persist as history; a patient/provider can delete per the retention policy.
- [ ] The data-flow policy is written and followed — what's stored, what leaves; invitation
  emails carry no PHI.
- [ ] Signed **BAAs** in place with every PHI-path vendor (Supabase, host, email).
- [ ] Encryption at rest + in transit; audit logging of release/view actions (NFR-01).
- [ ] HIPAA risk assessment done and a compliance professional signed off — required before
  *public launch* (may finish after dev, like the clinician gate in Phase 1).
- [ ] Sex-specific ranges, if adopted, are sourced + cited + clinician-signed, via the
  range-resolver.
- [ ] FHIR import is either shipped behind a patient confirmation screen, or explicitly deferred.

## Phase 3 — Clinics & providers · **folds into the Phase-2 plan above**

Because the intended product has providers dispatching links from day one, Phase 3's provider
features (release results, see who viewed what, invite patients by email) aren't a separate later
phase — they ride on the Phase-2 foundation and the full-HIPAA posture is assumed throughout.
The remaining Phase-3-specific decisions:

- **Provider access model** — how a provider releases a result to a patient, and viewed-status
  tracking (design, on top of the RLS rules in Decision 2).
- **Email invitations** — deliverability, and whether the email vendor is a new BAA counterparty
  (feeds the Decision-1 vendor list). Invitation links carry a token only, no PHI.
- **Formal audit controls** — the audit logging from Decision 2, formalized into an auditable,
  HIPAA-grade form.

## Parking lot — wanted, not yet scheduled

- **PDF/photo report upload** — deferred on purpose; it's the hardest, riskiest part of the
  product (every lab's layout differs, and a misread decimal like 1.2→12 produces a confidently
  wrong explanation). **Accuracy scaffolding that's non-negotiable when it returns:** extracted
  values are a *draft the user confirms row-by-row* against their paper, never trusted input; a
  golden corpus of real anonymized reports gates accuracy in CI; low-confidence rows are flagged,
  never silently accepted; and the data-egress question (a vision model likely means the report
  leaves the browser) is resolved *first*. Worth collecting anonymized sample reports whenever
  convenient.
- **Whole-panel plain-English summaries** (AI-composed) — would replace the Phase 0
  explanation-engine decision with a new one of its own.
- i18n / non-English content; pediatric ranges; tests beyond the v1 blood-panel set.
