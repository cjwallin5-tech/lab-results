import type {
  Explanation,
  PatientInfo,
  Report,
  ReportStatus,
  ResultRow,
  ShareLink,
} from "@/lib/model/types";

/** The fields a caller provides to open a new report; the rest are derived. */
export interface NewReport {
  patient: PatientInfo;
  pdfRef: string;
}

/**
 * The single persistence seam. Every layer talks to this interface, never to a
 * concrete store, so the local file adapter used on synthetic data can be
 * swapped for a Supabase adapter later without touching call sites. Status
 * changes go through setReportStatus, which enforces the status machine.
 */
export interface Repository {
  createReport(input: NewReport): Promise<Report>;
  getReport(id: string): Promise<Report | null>;
  listReports(): Promise<Report[]>;
  /** Transition a report's status; rejects an illegal jump. */
  setReportStatus(id: string, status: ReportStatus): Promise<Report>;

  saveRows(reportId: string, rows: ResultRow[]): Promise<void>;
  getRows(reportId: string): Promise<ResultRow[]>;

  saveExplanation(explanation: Explanation): Promise<Explanation>;
  getExplanation(reportId: string): Promise<Explanation | null>;

  createShareLink(reportId: string): Promise<ShareLink>;
  getShareLinkByToken(token: string): Promise<ShareLink | null>;
  markLinkOpened(token: string): Promise<void>;
}
