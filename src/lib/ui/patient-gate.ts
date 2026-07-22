import type { Explanation, Report, ResultRow } from '@/lib/types';

/**
 * The patient route's render decision (CLAUDE.md rule 7), pure so the gate is
 * exhaustively unit-testable: the async page component just calls this and maps
 * `blocked` to notFound(). Two independent invariants, both required:
 *
 * 1. Approval (FR-10): only an approved explanation on an approved/sent report
 *    renders. Every other status — including `held` — is blocked.
 * 2. Critical fail-safe (FR-07): a report containing a critical row never
 *    renders, EVEN IF its statuses say approved. Computed from the rows, not
 *    from `status === 'held'`, precisely so a report wrongly advanced past the
 *    held gate is still caught here.
 *
 * `blocked` carries no reason on purpose: the patient-facing response must be
 * content-neutral (a plain not-found — no test name, no value, not even that a
 * critical exists). Criticality reaches the patient only through the provider's
 * direct contact.
 */
export type PatientGateDecision = 'render' | 'blocked';

export function patientGate(input: {
  report: Pick<Report, 'status'> | null;
  explanation: Pick<Explanation, 'status'> | null;
  rows: Pick<ResultRow, 'classification'>[];
}): PatientGateDecision {
  const { report, explanation, rows } = input;
  if (report === null || explanation === null) return 'blocked';
  if (!(report.status === 'approved' || report.status === 'sent')) return 'blocked';
  if (explanation.status !== 'approved') return 'blocked';
  const hasCritical = rows.some(
    (row) => row.classification?.kind === 'range' && row.classification.critical,
  );
  if (hasCritical) return 'blocked';
  return 'render';
}
