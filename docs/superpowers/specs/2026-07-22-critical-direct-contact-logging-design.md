# Critical direct-contact logging

## Problem

A lab report with a critical ("panic") value is held: nothing is drafted, nothing is
sent, and the provider page names the critical test and says to contact the patient
directly (FR-07). Real critical-value handling requires the provider to reach the
patient and to **document** that contact. Today the app tells the provider to call but
gives them nowhere to record that they did. This feature adds that record.

## Outcome

On a held report's page, the provider can log the direct contact they made about each
critical result: method (phone or other), a short note, and a timestamp. Logged
contacts show under each critical result. The held report stays held; it is never
drafted or sent, and it never produces a patient page.

## Acceptance criteria

- A held report page shows, per critical result, either a "Log contact" form or the
  contact(s) already recorded (method, note, timestamp).
- Submitting the form records an `OutreachEntry` for that result and it appears on the
  page immediately.
- Logging contact never changes the report status, never drafts an explanation, and
  never creates a share link. The report remains held.
- No patient page can be produced for a held critical report (the existing render gate
  is unchanged and still holds).
- Notes, values, and analyte names are never written to logs (safety rule 5).
- `Start over` clears any logged outreach along with the rest of the report's progress.

## Non-goals

- No new report status. A held report stays `held`.
- No dashboard, worklist, or patient-side changes.
- No partial-report send (criticals held, routine results sent is a separate, larger
  change deliberately deferred).
- Outreach is provider documentation only; it does not notify the patient.

## Design

### Model (`src/lib/types`)

```ts
export type OutreachMethod = 'phone' | 'other';
export type OutreachEntry = {
  reportId: string;
  analyteId: string;
  method: OutreachMethod;
  note: string;
  at: string; // ISO timestamp
};
```

Outreach is its own collection, not a field on `Report`: it maps cleanly to a future
`outreach` table (report_id + analyte_id), the same way rows and explanations are
separate stores today.

### Data seam (`src/lib/data/index.ts` + `mock.ts`)

- `MOCK_OUTREACH: Record<string, OutreachEntry[]>` keyed by reportId, seeded empty for
  the held report (David Chen) so the demo shows the logging action.
- `getOutreach(reportId): Promise<OutreachEntry[]>`
- `addOutreach(reportId, entry): Promise<void>` (append)
- `resetReport` also deletes `MOCK_OUTREACH[reportId]`.

These become Supabase reads/writes later with no screen change, matching the existing
seam comment in `index.ts`.

### Pure helper (`src/lib/ui/outreach.ts` + colocated test)

- `criticalAnalyteIds(rows: ResultRow[]): string[]` - analyteIds of rows classified
  range + critical (skips criticals with no analyteId; nothing to key outreach on).
- `outstandingOutreach(criticalIds: string[], outreach: OutreachEntry[]): string[]` -
  critical analyteIds with no logged entry yet.

Pure, no I/O, so it is unit-testable and the page stays presentational.

### Action (`src/app/provider/actions.ts`)

`logOutreachAction(formData)`:
- Reads `reportId`, `analyteId`, `method`, `note`.
- Guards: the report must be `held` and the analyteId must be genuinely critical for
  this report (defense in depth, re-derive from stored rows, never trust the form).
- Rejects an empty note and a method outside the allowed set (inline, no throw).
- Appends the entry with `at = new Date().toISOString()`, then revalidates the page.
- Never logs the note, value, or analyte name.

### Held page (`src/app/provider/(app)/reports/[id]/page.tsx`)

The `held` section keeps its heading, warning, and the named critical list. Each
critical row gains: the recorded contact(s) if any (method, note, timestamp), and a
"Log contact" form (method select, note textarea, submit). A row with a logged contact
shows a "Contacted" pill.

The form is a plain server-action `<form>`; no client component is needed.

## Testing

- Unit (`src/lib/ui/outreach.test.ts`): `criticalAnalyteIds` picks only critical rows
  and skips criticals without an analyteId; `outstandingOutreach` returns the not-yet-
  logged critical ids.
- Unit (`src/lib/data`): `addOutreach` then `getOutreach` round-trips; `resetReport`
  clears outreach.
- E2E (`tests/e2e/full-loop.spec.ts`): open the seeded held report, log a contact for
  the critical result, confirm it is recorded on the page; confirm the report has no
  share link / no patient page.

## Build order

1. Type + data functions + `resetReport` clearing + mock store; unit round-trip test.
2. Pure helper + unit test.
3. `logOutreachAction`.
4. Held-page UI.
5. E2E extension; local walk with a screenshot.

## Constraints held

Criticals never reach the patient (render gate unchanged); both human gates unaffected;
no new status; no lab values, notes, or tokens to logs; no em dashes, no emojis;
sole-author commits.
