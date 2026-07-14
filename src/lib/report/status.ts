import type { ReportStatus } from "@/lib/model/types";

/**
 * The report status machine. Pure, no I/O. Every status change goes through
 * this guard so no code path can jump the workflow (for example straight from
 * uploaded to approved, skipping the two human gates).
 */

export const REPORT_STATUSES: readonly ReportStatus[] = [
  "uploaded",
  "extracted",
  "verified",
  "drafted",
  "approved",
  "sent",
];

const ALLOWED: Record<ReportStatus, readonly ReportStatus[]> = {
  uploaded: ["extracted"],
  extracted: ["verified"],
  verified: ["drafted"],
  drafted: ["approved"],
  approved: ["sent"],
  sent: [],
};

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  return ALLOWED[from].includes(to);
}

/** Throws when a transition is not allowed; use before persisting a status change. */
export function assertTransition(from: ReportStatus, to: ReportStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal report status transition: ${from} -> ${to}`);
  }
}

/** True once the report has been approved (its explanation may reach the patient). */
export function isPatientVisible(status: ReportStatus): boolean {
  return status === "approved" || status === "sent";
}
