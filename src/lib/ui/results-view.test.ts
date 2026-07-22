import { describe, expect, it } from 'vitest';
import type { Explanation, ResultRow } from '@/lib/types';
import { buildResultsView } from './results-view';

/**
 * The renderer fail-safe half of CLAUDE.md rule 7: buildResultsView refuses to
 * produce a view model containing a critical row, no matter how it was reached
 * (the route gate in patient-gate.ts is the primary defense; this is the last
 * line). The refusal must itself be content-neutral — the thrown message can
 * surface in logs or a dev overlay, so it must carry no value or test name.
 */

const explanation: Explanation = {
  id: 'exp-1',
  reportId: 'rpt-1',
  overallText: 'Overall.',
  perTest: [{ analyteId: 'potassium', text: 'Explained.' }],
  sources: [],
  status: 'approved',
  approvedAt: '2026-07-21T00:00:00.000Z',
};

function row(over: Partial<ResultRow>): ResultRow {
  return {
    id: 'r1',
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

describe('buildResultsView — critical fail-safe', () => {
  it('throws rather than build a view containing a critical row', () => {
    expect(() => buildResultsView([row({})], explanation)).toThrow(/critical/);
  });

  it('the thrown message is content-neutral: no value, unit, or test name', () => {
    let message = '';
    try {
      buildResultsView([row({})], explanation);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).not.toBe('');
    expect(message).not.toContain('6.8');
    expect(message).not.toContain('mmol');
    expect(message.toLowerCase()).not.toContain('potassium');
  });

  it('builds normally when no row is critical', () => {
    const view = buildResultsView(
      [row({ classification: { kind: 'range', band: 'above', critical: false } })],
      explanation,
    );
    expect(view.items).toHaveLength(1);
    expect(view.hasCritical).toBe(false);
    expect(view.items[0].meaning).toBe('Explained.');
  });
});

describe('buildResultsView: tone counts', () => {
  it('counts a not-covered test apart from a value to double-check', () => {
    const view = buildResultsView(
      [
        row({ id: 'a', classification: { kind: 'range', band: 'in', critical: false } }),
        row({ id: 'b', analyteId: undefined, classification: { kind: 'not-covered' } }),
        row({ id: 'c', classification: { kind: 'implausible' } }),
        row({ id: 'd', classification: { kind: 'unclassifiable', reason: 'non-numeric' } }),
      ],
      explanation,
    );
    // A not-covered test has no explanation yet (FR-04); it must not be lumped
    // in with values the classifier flagged to double-check (FR-08).
    expect(view.toneCounts.notCovered).toBe(1);
    expect(view.toneCounts.flagged).toBe(2);
    expect(view.toneCounts.inRange).toBe(1);
  });
});
