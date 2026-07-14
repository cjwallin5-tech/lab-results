import type {
  Explanation,
  OutreachEntry,
  PatientInfo,
  PatientQuestion,
  Report,
  ReportStatus,
  ResultRow,
  ResultSummary,
  ShareLink,
} from "@/lib/model/types";

/** Fields a caller may patch on a report outside the status machine. */
export type ReportPatch = Partial<Pick<Report, "providerNote" | "resultSummary">> & {
  resultSummary?: ResultSummary;
};

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
  /** Patch non-status fields (provider note, result summary). */
  updateReport(id: string, patch: ReportPatch): Promise<Report>;
  /** Log a direct contact with the patient about a critical result. */
  addOutreach(id: string, entry: OutreachEntry): Promise<Report>;
  /** Record a question the patient sent about the report. */
  addQuestion(id: string, question: PatientQuestion): Promise<Report>;

  saveRows(reportId: string, rows: ResultRow[]): Promise<void>;
  getRows(reportId: string): Promise<ResultRow[]>;

  saveExplanation(explanation: Explanation): Promise<Explanation>;
  getExplanation(reportId: string): Promise<Explanation | null>;

  createShareLink(reportId: string): Promise<ShareLink>;
  getShareLinkByToken(token: string): Promise<ShareLink | null>;
  getShareLinkByReport(reportId: string): Promise<ShareLink | null>;
  markLinkOpened(token: string): Promise<void>;
}
