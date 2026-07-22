import type {
  Classification,
  Explanation,
  OutreachEntry,
  PatientInfo,
  PerTestExplanation,
  Report,
  ReportStatus,
  ResultRow,
  ShareLink,
  Source,
} from '@/lib/types';

/**
 * The data layer's boundary: snake_case (Postgres) <-> camelCase (app) mapping and
 * the DataLayer contract. Pure — imports only types — so it carries colocated unit
 * tests and neither driver leaks database column names past this file.
 *
 * The DB row shapes below mirror supabase/migrations. `jsonb` columns (classification,
 * per_test, sources) hold data this app both writes and reads, so they are typed as the
 * domain shapes rather than validated as an untrusted boundary (CLAUDE.md reserves that
 * for the LLM output, upload metadata, and the patient's DOB). Nullable columns come
 * back as `null`; the mappers translate `null` to the app's `undefined`.
 */

// ---------------------------------------------------------------------------
// DB row shapes (snake_case)
// ---------------------------------------------------------------------------

export interface ReportRow {
  id: string;
  patient_name: string;
  patient_email: string;
  patient_dob: string;
  pdf_ref: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface ResultRowRow {
  id: string;
  report_id: string;
  raw_name: string;
  analyte_id: string | null;
  value: string;
  unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
  raw_range: string | null;
  lab_flags: string[];
  low_confidence_fields: string[];
  classification: Classification | null;
  ordinal: number; // sort key; the app has no matching field, so the read mapper drops it
}

export interface ExplanationRow {
  id: string;
  report_id: string;
  overall_text: string;
  per_test: PerTestExplanation[];
  sources: Source[];
  status: 'draft' | 'approved';
  approved_at: string | null;
}

export interface ShareLinkRow {
  id: string;
  report_id: string;
  token: string;
  expires_at: string;
  opened_at: string | null;
}

export interface OutreachRow {
  id: string;
  report_id: string;
  analyte_id: string;
  method: OutreachEntry['method'];
  note: string;
  at: string;
}

// ---------------------------------------------------------------------------
// Row -> app (read)
// ---------------------------------------------------------------------------

export function reportFromRow(row: ReportRow): Report {
  return {
    id: row.id,
    patient: { name: row.patient_name, email: row.patient_email, dob: row.patient_dob },
    pdfRef: row.pdf_ref,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function resultRowFromRow(row: ResultRowRow): ResultRow {
  return {
    id: row.id,
    reportId: row.report_id,
    rawName: row.raw_name,
    analyteId: row.analyte_id ?? undefined,
    value: row.value,
    unit: row.unit ?? undefined,
    refLow: row.ref_low ?? undefined,
    refHigh: row.ref_high ?? undefined,
    rawRange: row.raw_range ?? undefined,
    labFlags: row.lab_flags,
    lowConfidenceFields: row.low_confidence_fields,
    classification: row.classification ?? undefined,
  };
}

export function explanationFromRow(row: ExplanationRow): Explanation {
  return {
    id: row.id,
    reportId: row.report_id,
    overallText: row.overall_text,
    perTest: row.per_test,
    sources: row.sources,
    status: row.status,
    approvedAt: row.approved_at ?? undefined,
  };
}

export function shareLinkFromRow(row: ShareLinkRow): ShareLink {
  return {
    id: row.id,
    reportId: row.report_id,
    token: row.token,
    expiresAt: row.expires_at,
    openedAt: row.opened_at ?? undefined,
  };
}

export function outreachFromRow(row: OutreachRow): OutreachEntry {
  return {
    reportId: row.report_id,
    analyteId: row.analyte_id,
    method: row.method,
    note: row.note,
    at: row.at,
  };
}

// ---------------------------------------------------------------------------
// app -> row (write). Ids and timestamps are database-generated, so inserts omit
// them; the DB assigns a uuid and now() defaults.
// ---------------------------------------------------------------------------

export function reportToInsert(patient: PatientInfo, pdfRef: string) {
  return {
    patient_name: patient.name,
    patient_email: patient.email,
    patient_dob: patient.dob,
    pdf_ref: pdfRef,
    status: 'uploaded' satisfies ReportStatus,
  };
}

export function resultRowToInsert(reportId: string, row: ResultRow, ordinal: number) {
  return {
    report_id: reportId,
    raw_name: row.rawName,
    analyte_id: row.analyteId ?? null,
    value: row.value,
    unit: row.unit ?? null,
    ref_low: row.refLow ?? null,
    ref_high: row.refHigh ?? null,
    raw_range: row.rawRange ?? null,
    lab_flags: row.labFlags,
    low_confidence_fields: row.lowConfidenceFields,
    classification: row.classification ?? null,
    ordinal, // caller passes the array index so read order matches the PDF
  };
}

export function outreachToInsert(reportId: string, entry: OutreachEntry) {
  return {
    report_id: reportId,
    analyte_id: entry.analyteId,
    method: entry.method,
    note: entry.note,
    at: entry.at,
  };
}

// ---------------------------------------------------------------------------
// The seam both drivers implement. reportHasCritical is intentionally absent: it
// is derived once in index.ts from getRows, so the critical-detection predicate
// lives in exactly one place regardless of driver.
// ---------------------------------------------------------------------------

export interface DataLayer {
  listReports(): Promise<Report[]>;
  getReport(id: string): Promise<Report | null>;
  getRows(reportId: string): Promise<ResultRow[]>;
  getExplanation(reportId: string): Promise<Explanation | null>;
  getShareLinkByToken(token: string): Promise<ShareLink | null>;
  getShareLinkByReport(reportId: string): Promise<ShareLink | null>;
  markShareLinkOpened(token: string): Promise<void>;
  createReport(patient: PatientInfo, pdfRef: string): Promise<Report>;
  saveRows(reportId: string, rows: ResultRow[]): Promise<void>;
  resetReport(reportId: string): Promise<void>;
  getOutreach(reportId: string): Promise<OutreachEntry[]>;
  addOutreach(reportId: string, entry: OutreachEntry): Promise<void>;
  setReportStatus(reportId: string, status: ReportStatus): Promise<void>;
  saveExplanation(
    reportId: string,
    content: Pick<Explanation, 'overallText' | 'perTest' | 'sources'>,
  ): Promise<void>;
  approveExplanation(reportId: string): Promise<void>;
  createShareLink(reportId: string): Promise<ShareLink>;
}
