import { randomBytes } from 'node:crypto';
import type { Explanation, Report, ReportStatus, ResultRow, ShareLink } from '@/lib/types';
import { MOCK_EXPLANATIONS, MOCK_REPORTS, MOCK_ROWS, MOCK_SHARE_LINKS } from './mock';

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

export async function setReportStatus(reportId: string, status: ReportStatus): Promise<void> {
  const report = MOCK_REPORTS.find((candidate) => candidate.id === reportId);
  if (report === undefined) return;
  report.status = status;
  report.updatedAt = new Date().toISOString();
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
