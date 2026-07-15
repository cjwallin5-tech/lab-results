import type { Explanation, ResultRow } from '@/lib/types';
import { MOCK_EXPLANATIONS, MOCK_ROWS } from './mock';

/**
 * When a freshly uploaded mock report is "read" and "drafted", it borrows a
 * representative rows-and-explanation set so the provider flow can be walked
 * end to end on mock data. The real rows come from the Logic track's extraction
 * and the real text from the Content track's drafting.
 */

export function ensureExtractedRows(reportId: string): void {
  if ((MOCK_ROWS[reportId] ?? []).length > 0) return;
  MOCK_ROWS[reportId] = MOCK_ROWS['rpt-alvarez'].map((row, index) => ({
    ...row,
    id: `${reportId}-${index}`,
    reportId,
  }));
}

export function ensureDraftExplanation(reportId: string): void {
  if (MOCK_EXPLANATIONS[reportId] !== undefined) return;
  const base = MOCK_EXPLANATIONS['rpt-alvarez'];
  const draft: Explanation = {
    ...base,
    id: `exp-${reportId}`,
    reportId,
    status: 'draft',
    approvedAt: undefined,
  };
  MOCK_EXPLANATIONS[reportId] = draft;
}

export function rowsFor(reportId: string): ResultRow[] {
  return MOCK_ROWS[reportId] ?? [];
}
