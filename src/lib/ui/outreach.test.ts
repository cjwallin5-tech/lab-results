import { describe, expect, it } from 'vitest';
import type { OutreachEntry, ResultRow } from '@/lib/types';
import { criticalAnalyteIds, outstandingOutreach } from './outreach';

function row(over: Partial<ResultRow>): ResultRow {
  return {
    id: 'r',
    reportId: 'rpt-1',
    rawName: 'Potassium',
    analyteId: 'potassium',
    value: '6.8',
    unit: 'mmol/L',
    refLow: 3.5,
    refHigh: 5.1,
    labFlags: [],
    lowConfidenceFields: [],
    classification: { kind: 'range', band: 'above', critical: true },
    ...over,
  };
}

describe('criticalAnalyteIds', () => {
  it('returns only rows classified critical', () => {
    const ids = criticalAnalyteIds([
      row({ id: 'a', analyteId: 'potassium' }),
      row({
        id: 'b',
        analyteId: 'sodium',
        classification: { kind: 'range', band: 'in', critical: false },
      }),
    ]);
    expect(ids).toEqual(['potassium']);
  });

  it('skips a critical row that has no analyteId to key contact on', () => {
    const ids = criticalAnalyteIds([row({ id: 'a', analyteId: undefined })]);
    expect(ids).toEqual([]);
  });
});

describe('outstandingOutreach', () => {
  const contact = (analyteId: string): OutreachEntry => ({
    reportId: 'rpt-1',
    analyteId,
    method: 'phone',
    note: 'Called.',
    at: '2026-07-22T15:00:00.000Z',
  });

  it('returns critical ids with no logged contact yet', () => {
    expect(outstandingOutreach(['potassium', 'calcium'], [contact('potassium')])).toEqual([
      'calcium',
    ]);
  });

  it('returns empty once every critical is contacted', () => {
    expect(outstandingOutreach(['potassium'], [contact('potassium')])).toEqual([]);
  });
});
