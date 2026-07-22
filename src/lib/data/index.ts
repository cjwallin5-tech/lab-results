import { randomBytes } from 'node:crypto';
import type {
  Explanation,
  OutreachEntry,
  Report,
  ReportStatus,
  ResultRow,
  ShareLink,
} from '@/lib/types';
import {
  MOCK_EXPLANATIONS,
  MOCK_OUTREACH,
  MOCK_REPORTS,
  MOCK_ROWS,
  MOCK_SHARE_LINKS,
} from './mock';

/**
 * The web page's read layer. Async on purpose: today it returns mock data, and
 * when the Supabase data-access functions exist these bodies swap to real
 * queries with no change to any screen.
 */

export async function listReports(): Promise<Report[]> {
  return [...MOCK_REPORTS].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getReport(id: string): Promise<Report | null> {
  return MOCK_REPORTS.find((report) => report.id === id) ?? null;
}

export async function getRows(reportId: string): Promise<ResultRow[]> {
  return MOCK_ROWS[reportId] ?? [];
}

export async function getExplanation(reportId: string): Promise<Explanation | null> {
  return MOCK_EXPLANATIONS[reportId] ?? null;
}

export async function getShareLinkByToken(token: string): Promise<ShareLink | null> {
  return MOCK_SHARE_LINKS.find((link) => link.token === token) ?? null;
}

export async function getShareLinkByReport(reportId: string): Promise<ShareLink | null> {
  return MOCK_SHARE_LINKS.find((link) => link.reportId === reportId) ?? null;
}

/**
 * Mock writes: mutate the in-memory data so the provider workflow can be clicked
 * through within a dev session (state resets on restart). These become Supabase
 * writes later; the screens do not change. Classification and drafting are the
 * Logic and Content tracks' jobs, so here they are pre-baked in the mock rows.
 */

export async function createReport(patient: Report['patient'], pdfRef: string): Promise<Report> {
  const now = new Date().toISOString();
  const report: Report = {
    id: `rpt-${randomBytes(4).toString('hex')}`,
    patient,
    pdfRef,
    status: 'uploaded',
    createdAt: now,
    updatedAt: now,
  };
  MOCK_REPORTS.push(report);
  return report;
}

export async function saveRows(reportId: string, rows: ResultRow[]): Promise<void> {
  MOCK_ROWS[reportId] = rows;
}

/** Reset a report to the start of the workflow, clearing its progress. */
export async function resetReport(reportId: string): Promise<void> {
  const report = MOCK_REPORTS.find((candidate) => candidate.id === reportId);
  if (report === undefined) return;
  report.status = 'uploaded';
  report.updatedAt = new Date().toISOString();
  delete MOCK_ROWS[reportId];
  delete MOCK_EXPLANATIONS[reportId];
  delete MOCK_OUTREACH[reportId];
  for (let i = MOCK_SHARE_LINKS.length - 1; i >= 0; i -= 1) {
    if (MOCK_SHARE_LINKS[i].reportId === reportId) MOCK_SHARE_LINKS.splice(i, 1);
  }
}

/** Direct-contact records a provider logged for a held report's critical results. */
export async function getOutreach(reportId: string): Promise<OutreachEntry[]> {
  return MOCK_OUTREACH[reportId] ?? [];
}

/** Append one contact record. Provider documentation only; never lifts the hold. */
export async function addOutreach(reportId: string, entry: OutreachEntry): Promise<void> {
  (MOCK_OUTREACH[reportId] ??= []).push(entry);
}

export async function setReportStatus(reportId: string, status: ReportStatus): Promise<void> {
  const report = MOCK_REPORTS.find((candidate) => candidate.id === reportId);
  if (report === undefined) return;
  report.status = status;
  report.updatedAt = new Date().toISOString();
}

/**
 * Store a freshly drafted explanation as a `draft` (FR-09/FR-10): unapproved
 * until a provider approves it. Overwrites a prior *draft* so a re-draft
 * replaces it — but never an approved record: approved explanations are frozen
 * (CLAUDE.md); the sanctioned route to re-draft is resetReport, which deletes
 * the explanation (clearing approval) first. Enforced here in the write layer so
 * no caller can bypass it; the Supabase swap must keep this guard.
 */
export async function saveExplanation(
  reportId: string,
  content: Pick<Explanation, 'overallText' | 'perTest' | 'sources'>,
): Promise<void> {
  if (MOCK_EXPLANATIONS[reportId]?.status === 'approved') {
    throw new Error(
      'refusing to overwrite an approved explanation: approved records are frozen (FR-10)',
    );
  }
  MOCK_EXPLANATIONS[reportId] = {
    id: `exp-${reportId}`,
    reportId,
    status: 'draft',
    approvedAt: undefined,
    ...content,
  };
}

export async function approveExplanation(reportId: string): Promise<void> {
  const explanation = MOCK_EXPLANATIONS[reportId];
  if (explanation === undefined) return;
  explanation.status = 'approved';
  explanation.approvedAt = new Date().toISOString();
}

export async function createShareLink(reportId: string): Promise<ShareLink> {
  const existing = MOCK_SHARE_LINKS.find((link) => link.reportId === reportId);
  if (existing !== undefined) return existing;
  const link: ShareLink = {
    id: `sl-${randomBytes(4).toString('hex')}`,
    reportId,
    token: randomBytes(18).toString('base64url'),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    openedAt: undefined,
  };
  MOCK_SHARE_LINKS.push(link);
  return link;
}

export async function reportHasCritical(reportId: string): Promise<boolean> {
  return (MOCK_ROWS[reportId] ?? []).some(
    (row) => row.classification?.kind === 'range' && row.classification.critical,
  );
}
