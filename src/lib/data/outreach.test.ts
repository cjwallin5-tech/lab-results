import { describe, expect, it } from 'vitest';
import type { OutreachEntry } from '@/lib/types';
import { addOutreach, createReport, getOutreach, resetReport } from './index';

/**
 * The outreach store backs the held-report contact log (FR-07). A fresh report
 * per test keeps these from touching the seeded fixtures or each other.
 */

function entry(over: Partial<OutreachEntry> = {}): OutreachEntry {
  return {
    reportId: 'rpt-x',
    analyteId: 'potassium',
    method: 'phone',
    note: 'Reached the patient; advised to come in today.',
    at: '2026-07-22T15:00:00.000Z',
    ...over,
  };
}

describe('outreach store', () => {
  it('round-trips appended entries in order', async () => {
    const report = await createReport(
      { name: 'Test Patient', email: 't@example.test', dob: '1980-01-01' },
      'manual-entry',
    );
    expect(await getOutreach(report.id)).toEqual([]);

    await addOutreach(report.id, entry({ reportId: report.id }));
    await addOutreach(report.id, entry({ reportId: report.id, analyteId: 'sodium' }));

    const logged = await getOutreach(report.id);
    expect(logged).toHaveLength(2);
    expect(logged.map((e) => e.analyteId)).toEqual(['potassium', 'sodium']);
  });

  it('resetReport clears logged outreach', async () => {
    const report = await createReport(
      { name: 'Test Patient', email: 't@example.test', dob: '1980-01-01' },
      'manual-entry',
    );
    await addOutreach(report.id, entry({ reportId: report.id }));
    await resetReport(report.id);
    expect(await getOutreach(report.id)).toEqual([]);
  });
});
