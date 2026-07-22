import { describe, expect, it } from 'vitest';
import type { ReportStatus, ResultRow } from '@/lib/types';
import { patientGate } from './patient-gate';

/**
 * The gate test CLAUDE.md rule 7 requires: no route renders unapproved text, and
 * a report with a critical row can never render — even when its statuses say
 * approved. Exhaustive over report status × explanation status × critical,
 * so a new status can't slip through unconsidered.
 */

const ALL_REPORT_STATUSES: ReportStatus[] = [
  'uploaded',
  'extracted',
  'verified',
  'held',
  'drafted',
  'approved',
  'sent',
];

const normalRows: Pick<ResultRow, 'classification'>[] = [
  { classification: { kind: 'range', band: 'in', critical: false } },
  { classification: { kind: 'not-covered' } },
];
const criticalRows: Pick<ResultRow, 'classification'>[] = [
  { classification: { kind: 'range', band: 'in', critical: false } },
  { classification: { kind: 'range', band: 'above', critical: true } },
];

describe('patientGate — approval invariant (FR-10)', () => {
  for (const status of ALL_REPORT_STATUSES) {
    const shouldRender = status === 'approved' || status === 'sent';
    it(`report '${status}' + approved explanation → ${shouldRender ? 'render' : 'blocked'}`, () => {
      const decision = patientGate({
        report: { status },
        explanation: { status: 'approved' },
        rows: normalRows,
      });
      expect(decision).toBe(shouldRender ? 'render' : 'blocked');
    });
  }

  for (const status of ALL_REPORT_STATUSES) {
    it(`report '${status}' + draft explanation → blocked (unapproved text never renders)`, () => {
      const decision = patientGate({
        report: { status },
        explanation: { status: 'draft' },
        rows: normalRows,
      });
      expect(decision).toBe('blocked');
    });
  }

  it('missing report or explanation → blocked', () => {
    expect(
      patientGate({ report: null, explanation: { status: 'approved' }, rows: normalRows }),
    ).toBe('blocked');
    expect(
      patientGate({ report: { status: 'approved' }, explanation: null, rows: normalRows }),
    ).toBe('blocked');
  });
});

describe('patientGate — critical fail-safe (FR-07)', () => {
  for (const status of ALL_REPORT_STATUSES) {
    it(`a critical row blocks even at report '${status}' with an approved explanation`, () => {
      const decision = patientGate({
        report: { status },
        explanation: { status: 'approved' },
        rows: criticalRows,
      });
      expect(decision).toBe('blocked');
    });
  }

  it('non-critical out-of-range and safe-state rows do not block an approved report', () => {
    const rows: Pick<ResultRow, 'classification'>[] = [
      { classification: { kind: 'range', band: 'above', critical: false } },
      { classification: { kind: 'implausible' } },
      { classification: { kind: 'unclassifiable', reason: 'non-numeric' } },
      { classification: undefined },
    ];
    expect(
      patientGate({ report: { status: 'sent' }, explanation: { status: 'approved' }, rows }),
    ).toBe('render');
  });
});
