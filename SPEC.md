# Lab Result Explainer — Product spec

> **Status:** This spec describes intended behavior. Nothing has been implemented yet (as of 2026-07-07 the repo is empty).

## Purpose

People get blood work back and have no idea what the numbers mean. Lab reports are dense with values, units, and medical terminology that patients don't understand. Lab Result Explainer takes a person's lab results and gives plain-language, human-reviewed explanations of what each test measures and what their values mean relative to their reference range — education, never medical advice or diagnosis. It works when a user can enter their panel, see every value correctly classified, and read explanations they actually understand.

## Goals

- [ ] V1: an anonymous, no-login web tool — user manually enters lab results, gets plain-language explanations, nothing is stored server-side
- [ ] Cover the ~40–60 most common tests: CBC, CMP/BMP, lipid panel, thyroid (TSH/T3/T4), HbA1c, vitamin D/B12, iron studies, basic urinalysis
- [ ] Every explanation shown to a user has been human-reviewed before ship
- [ ] Critical and implausible values are handled with distinct, safety-first behavior (see FR-07..FR-10)

## Non-goals

- **Diagnosis or treatment advice — permanently out of scope.** The tool explains what tests measure and what ranges mean; it never tells a user what condition they have or what to do about it (beyond "talk to your provider"). This is the product's identity.
- Replacing the conversation with a provider — the tool consistently redirects to one.

## Users

### Anonymous visitor (v1 — the only role)
- A patient (or family member) holding a lab report they don't understand
- No medical background; general consumer technical level
- Job: "tell me what these numbers mean, in words I understand, right now, without signing up"

### Patient (planned, phase 2 — not in v1)
- Logs in to see results released to them, with history over time
- Joins by clinic email invitation only — no open signup

### Provider / clinic staff (planned, phase 3 — not in v1)
- Clinic view: release results to patients, see who has viewed what
- Invites patients by email

## Functional requirements

### Manual result entry (v1)
- FR-01: A user can enter a lab result as test + value + unit, with reference range optional per entry.
- FR-02: Test selection offers the covered analytes by common name and abbreviation (e.g. "Hemoglobin", "HGB"); free-text entry of an uncovered test is allowed and routes to FR-11.
- FR-03: Each analyte accepts its common units (US and SI where both exist, e.g. glucose mg/dL and mmol/L) and converts internally to a canonical unit for classification.
- FR-04: A user can enter multiple results as one panel and get all explanations on a single results view.

### Classification (v1)
- FR-05: If the user entered the reference range printed on their report, classification (low / normal / high) uses that range.
- FR-06: If no range was entered, classification falls back to the curated typical adult range, and the result is visibly labeled "based on a typical range — your lab's range may differ."
- FR-07: Values beyond curated critical thresholds are classified critical and display a prominent urgent callout: this result may need prompt medical attention — contact your provider or seek urgent care.
- FR-08: For critical values, the "possible causes / what high or low can mean" content is suppressed and replaced with a single redirect sentence ("values at this level are a conversation for your provider"); the "what this test measures" content still shows.
- FR-09: Values beyond curated plausibility bounds (physiologically impossible, typo territory) are not classified; the user gets a "please double-check this entry" prompt instead.
- FR-10: Classification logic is pure and deterministic: same inputs always produce the same classification, driven entirely by curated data (no runtime generation).

### Explanations (v1)
- FR-11: An unrecognized test gets an honest "we don't cover this test yet" response — never a guess or generated content.
- FR-12: Each covered analyte has curated content: what the test measures, and what high/low values can mean (shown per FR-08 rules).
- FR-13: Every curated content entry carries `reviewed_by` and `reviewed_date`; unreviewed content is blocked from shipping by CI (see Definition of done).
- FR-14: Every results view displays the education-only disclaimer: this is educational information, not medical advice; consult your provider.

### Privacy & data handling (v1)
- FR-15: No lab value, range, or any user input is persisted server-side. Results exist only for the duration of the session, client-side.
- FR-16: No lab value is sent to any third-party service (LLM API, analytics, error tracking). Per the hand-written, human-reviewed explanation approach (curated library + rules), this is absolute for v1. Error reporting must scrub values before transmission.

## Non-functional requirements

- NFR-01: **Compliance posture escalates per phase.** V1 (ephemeral, no accounts): standard web-app security, honest privacy page. **Escalation trigger 1 — anything persists or accounts exist (phase 2):** PHI-grade handling (encryption at rest and in transit, minimal retention, access logging; FTC Health Breach Notification Rule applies). **Escalation trigger 2 — clinics/providers onboard (phase 3):** full HIPAA posture (providers are covered entities; BAAs with all vendors, formal audit controls).
- NFR-02: Explanations written in plain language, targeting roughly an 8th-grade reading level (consistent with common health-literacy guidance for patient materials); the content owner may tune this in the content style guide.
- NFR-03: Accessible: WCAG 2.1 AA; the urgent-callout state must not rely on color alone.
- NFR-04: The enter→explain flow works on mobile browsers; entering a 20-value panel is workable on a phone.
- NFR-05: Adult reference ranges only in v1 — single combined ranges, not sex-specific (sex-specific deferred to phase 2); the UI states this limitation. English only in v1.

## User flows

### Enter a panel → read explanations (v1 core flow)
1. User lands on the tool; sees what it does, the education-only disclaimer, and the privacy promise (nothing stored).
2. User adds results one at a time: picks a test, enters value + unit, optionally the printed reference range.
3. User submits the panel.
4. Each result renders with: classification (with range-source label per FR-06), what the test measures, and what the value can mean — or the critical/implausible/unknown-test treatment (FR-07..FR-09, FR-11).
5. User can edit any entry and re-explain; leaving the page discards everything (FR-15).

## Data model

Logical model — v1 has no database; curated data ships as versioned files in the repo, user input lives only in session state. There are exactly **three** shapes; they're the seam between the tracks — **Content** fills in `Analyte` + `ContentEntry`, **Classify** reads them to judge each value, **UI** displays the result. Agreed by the team 2026-07-08.

> ⚠️ **Every number in the examples below is a made-up placeholder to show *structure* — not a real medical value.** Real reference ranges and thresholds come only from cited sources (with clinician sign-off on criticals). Never copy an example number into real data.

### Analyte (the facts about one test — curated, versioned in repo)

One record per test (~40–60 total). This is the reference data the classification code runs on.

```
id:             "hemoglobin"
names:          ["Hemoglobin", "HGB", "Hgb"]
canonical_unit: "g/dL"
accepted_units: [ { unit: "g/dL", factor: 1 }, { unit: "g/L", factor: 0.1 } ]
typical_range:  { low: 13.5, high: 17.5 }
critical_low:   7.0
critical_high:  20.0
plausible_min:  2.0
plausible_max:  25.0
panel:          "CBC"
```

| Field | Type | Plain meaning |
|---|---|---|
| `id` | slug | Permanent internal name. **Never renamed** once golden fixtures reference it. |
| `names` | list of strings | Every way a person might write the test (full name + abbreviations), so the form finds it. |
| `canonical_unit` | string | The one unit classification math runs in. |
| `accepted_units` | list of `{ unit, factor }` | Units a user may enter + the multiplier to convert each into the canonical unit (canonical's own factor = `1`). |
| `typical_range` | `{ low?, high? }` | Curated adult fallback "normal," used **only** when the user didn't type the range off their own report. |
| `critical_low` / `critical_high` | number, optional | Danger thresholds that trigger the urgent banner (FR-07). Absent = never triggers it. **Safety-critical — cited source + clinician sign-off required.** |
| `plausible_min` / `plausible_max` | number, optional | "Physically impossible, probably a typo" bounds (FR-09). Outside these = "please double-check." |
| `panel` | string | Group it belongs to (CBC, CMP, lipid, thyroid…), for on-screen grouping. |

*Sources (decided 2026-07-08, cited per analyte): `typical_range` — major-lab published ranges (Labcorp/Quest) + professional-society references; `critical_low/high` — professional-society / clinical-guideline references, clinician sign-off required (the only numbers that require it); plain-language meaning content — NIH/MedlinePlus.*

Ranges are read through a single **range-resolver** in `src/lib/classify/` — never by reading the fields directly elsewhere — so per-sex ranges can be added in phase 2 as a contained, backward-compatible change (extend the resolver + data, add a sex input; no data migration since v1 stores nothing).

### ContentEntry (the writing for one test — curated, versioned in repo, 1:1 with Analyte)

The human-reviewed medical writing — the **only** source of user-facing medical text.

```
analyte_id:       "hemoglobin"
what_it_measures: "Hemoglobin is the protein in red blood cells that carries oxygen…"
meaning_low:      "A lower-than-usual level can mean the blood is carrying less oxygen…"
meaning_high:     "A higher-than-usual level can happen when…"
reviewed_by:      null
reviewed_date:    null
```

| Field | Type | Plain meaning |
|---|---|---|
| `analyte_id` | slug | Which test this writing belongs to (matches `Analyte.id`). |
| `what_it_measures` | text | Always shown. The "what is this test" paragraph. |
| `meaning_low` / `meaning_high` | text, optional | The "what a low/high value can mean" text. Suppressed for critical values (FR-08). If absent for a direction, the UI shows `what_it_measures` + the standard provider-redirect line — never invented text. |
| `reviewed_by` | name or `null` | The human-approval gate. `null` = not approved = **build refuses to ship it** (FR-13). |
| `reviewed_date` | date or `null` | When it was approved. |

### UserResult (what the person typed — session-only, never persisted)

Lives only in the browser, created fresh each session; never saved (FR-15).

```
analyte_id:  "hemoglobin"          (or empty if it's a test we don't cover)
raw_name:    "Hemoglobin"          (exactly what the user picked/typed)
value:       12.1
unit:        "g/dL"
user_range:  { low: 13.0, high: 17.0 }        (optional — from their own report)
derived:     { classification: "low", range_source: "user" }
```

| Field | Type | Plain meaning |
|---|---|---|
| `analyte_id` | slug or empty | The matched test, or empty for an uncovered test (→ FR-11 "we don't cover this yet"). |
| `raw_name` | string | Exactly what the user entered — always kept, so we can echo it back and drive the unknown-test fallback. |
| `value` / `unit` | number / string | Their number and the unit they chose. |
| `user_range` | `{ low, high }`, optional | The range printed on *their* report, if entered — takes priority over `typical_range` (FR-05). |
| `derived` | object | Filled in by the classification code — the answer. `classification`: `low \| normal \| high \| critical \| implausible \| unknown-test`; `range_source`: `user \| typical` (lets the UI say "based on a typical range — yours may differ"). |

### Why the shapes are the way they are (settled 2026-07-08)

Short notes on the design calls baked into the shapes above — so the reasoning isn't lost:

- **Ranges can be one-sided.** `low`/`high` are each optional on every range (typical and user), so banded tests, one-sided tests (e.g. cholesterol, "under ~200"), and open-ended tests all fit one shape. A missing side means "no bound that way."
- **One combined adult range in v1 (not sex-specific).** Many tests differ by sex, but v1 keeps a single adult range and leans on the "your lab's range may differ" label; sex-specific ranges are deferred to phase 2 and stay easy to add via the range-resolver (NFR-05).
- **Unit conversion is a single multiplier.** Every conversion in the v1 blood-panel set is "multiply by a constant" (`factor`) — none need an offset formula. If one ever does, that's a superseding decision.
- **Meaning text is optional per direction.** `meaning_low`/`meaning_high` are each optional; a value landing in a direction with no written meaning safely falls back to `what_it_measures` + the provider-redirect line, never invented text.
- **Critical/plausibility thresholds are optional per test.** Absent `critical_*` = that test never triggers the urgent banner; absent plausibility bounds = no double-check prompt for that direction.
- **Uncovered tests need no shape change.** `UserResult` always keeps `raw_name` and leaves `analyte_id` empty; the classifier returns `unknown-test` and the UI shows the honest fallback (FR-11).

## API contracts

None in v1 — no external consumers. The FHIR integration surface (patient-side SMART on FHIR) will be specified when phase 2 is planned.

## Definition of done (v1 core feature)

All three gates must pass:

1. **Golden classification suite** — a fixed corpus of sample panels with hand-verified expected outputs (classification per value, unit conversions, range-source labeling, critical/implausible/unknown handling). Runs in CI on every change; 100% pass required. These fixtures encode the acceptance bar — they are never edited to make a failing implementation pass.
2. **E2E flow test** — an automated browser test: load app → enter a panel → submit → assert correct explanations, labels, and banners render (including one critical value and one unknown test).
3. **Content review gate** — CI blocks ship if any ContentEntry has `reviewed_by` unset. A clinician reviewer is available (team connection to a doctor, secured 2026-07-08); the clinician reviews the full content library before public launch. # TODO: confirm the clinician's name and commitment.

## Out of scope / future

- Accounts, saved history, trend tracking (phase 2)
- Patient-side FHIR import via SMART on FHIR (phase 2 — lands with accounts, where the OAuth plumbing pays off)
- Provider/clinic features: result release, viewed-status, email invitations (phase 3)
- PDF/photo upload and parsing (deferred — hardest/riskiest; see the ROADMAP parking lot for the accuracy plan when it returns)
- Non-blood specimens and specialty tests: microbiology, pathology, genetics, tumor markers
- i18n / non-English content; pediatric reference ranges; sex-specific reference ranges (planned for phase 2 — v1 uses combined adult ranges, kept easy to upgrade via the range-resolver)
- Diagnosis or treatment advice (permanent — see Non-goals)
