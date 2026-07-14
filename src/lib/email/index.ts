/**
 * Outbound email seam. Offline (no provider key) it records an event without
 * any PII, token, or link so the flow can be demonstrated and asserted without
 * sending anything. A real provider (Resend or SMTP) slots in behind this.
 *
 * The in-memory log exists only so the offline demo and the E2E test can
 * confirm a message was "sent"; it never stores addresses, tokens, or bodies.
 */

export type EmailKind = "share-link" | "question";

interface SentRecord {
  kind: EmailKind;
  at: string;
}

const sent: SentRecord[] = [];

function record(kind: EmailKind): void {
  sent.push({ kind, at: new Date().toISOString() });
  console.info(`[email] ${kind} queued`);
}

/** Notify a patient that results are ready. The link/token are never logged. */
export async function sendShareLink(): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    // Live email is deferred to the real-PHI phase (notify-only, no PHI in body).
  }
  record("share-link");
}

/** Forward a patient's question to the office address. Content is never logged. */
export async function sendQuestion(): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    // Live email deferred.
  }
  record("question");
}

/** Test/demo helper: how many messages of a kind have been queued this process. */
export function sentCount(kind: EmailKind): number {
  return sent.filter((entry) => entry.kind === kind).length;
}
