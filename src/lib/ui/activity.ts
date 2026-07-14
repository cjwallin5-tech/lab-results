import type { Report, ShareLink } from "@/lib/model/types";
import { reportStatusDisplay } from "./report-status-display";
import type { Tone } from "./classification-display";

/**
 * Cross-report views for the provider dashboard, pure. The worklist is what
 * needs the provider's action; the activity feed is what recently happened.
 */

export interface WorklistItem {
  reportId: string;
  patientName: string;
  label: string;
  tone: Tone;
}

export interface ActivityEvent {
  at: string;
  reportId: string;
  patientName: string;
  label: string;
}

/** True when an approved report still has critical results awaiting a direct call. */
export function hasOutreachPending(report: Report): boolean {
  const critical = report.resultSummary?.critical ?? 0;
  return report.status === "approved" && critical > report.outreach.length;
}

export function buildWorklist(reports: Report[]): WorklistItem[] {
  const items: WorklistItem[] = [];
  for (const report of reports) {
    if (report.status === "drafted") {
      items.push({ reportId: report.id, patientName: report.patient.name, label: "Draft ready to review", tone: "high" });
    } else if (report.status === "approved") {
      items.push(
        hasOutreachPending(report)
          ? { reportId: report.id, patientName: report.patient.name, label: "Critical results need a direct call", tone: "critical" }
          : { reportId: report.id, patientName: report.patient.name, label: "Approved, ready to send", tone: "in" },
      );
    }
    if (report.questions.length > 0) {
      const plural = report.questions.length > 1 ? "questions" : "question";
      items.push({ reportId: report.id, patientName: report.patient.name, label: `${report.questions.length} ${plural} from the patient`, tone: "neutral" });
    }
  }
  return items;
}

export function buildActivity(reports: Report[], links: ShareLink[], limit = 8): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  for (const report of reports) {
    for (const event of report.statusHistory) {
      events.push({ at: event.at, reportId: report.id, patientName: report.patient.name, label: reportStatusDisplay(event.status).label });
    }
    for (const entry of report.outreach) {
      events.push({ at: entry.at, reportId: report.id, patientName: report.patient.name, label: "Logged a direct contact about a critical result" });
    }
    for (const question of report.questions) {
      events.push({ at: question.at, reportId: report.id, patientName: report.patient.name, label: "Patient asked a question" });
    }
  }
  const reportById = new Map(reports.map((report) => [report.id, report]));
  for (const link of links) {
    const report = link.openedAt !== null ? reportById.get(link.reportId) : undefined;
    if (report !== undefined && link.openedAt !== null) {
      events.push({ at: link.openedAt, reportId: report.id, patientName: report.patient.name, label: "Patient opened their results" });
    }
  }
  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
