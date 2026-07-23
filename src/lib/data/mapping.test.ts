import { describe, expect, it } from 'vitest';
import {
  explanationFromRow,
  outreachFromRow,
  outreachToInsert,
  reportFromRow,
  reportToInsert,
  resultRowFromRow,
  resultRowToInsert,
  shareLinkFromRow,
} from './mapping';

/**
 * The mappers are the only place database column names exist in app terms. These
 * pin the snake_case<->camelCase translation and the null->undefined rule so a
 * driver swap can't silently reshape a row.
 */

describe('reportFromRow', () => {
  it('embeds the patient fields and renames columns', () => {
    expect(
      reportFromRow({
        id: 'r1',
        patient_name: 'Maria Alvarez',
        patient_email: 'maria@example.test',
        patient_dob: '1984-03-12',
        pdf_ref: 'alvarez-lipid',
        status: 'sent',
        created_at: '2026-07-13T15:20:00Z',
        updated_at: '2026-07-13T15:40:00Z',
      }),
    ).toEqual({
      id: 'r1',
      patient: { name: 'Maria Alvarez', email: 'maria@example.test', dob: '1984-03-12' },
      pdfRef: 'alvarez-lipid',
      status: 'sent',
      createdAt: '2026-07-13T15:20:00Z',
      updatedAt: '2026-07-13T15:40:00Z',
    });
  });
});

describe('resultRowFromRow', () => {
  it('turns null columns into undefined', () => {
    const mapped = resultRowFromRow({
      id: 'row1',
      report_id: 'r1',
      raw_name: 'Iron',
      analyte_id: null,
      value: '65',
      unit: null,
      ref_low: null,
      ref_high: null,
      raw_range: null,
      lab_flags: [],
      low_confidence_fields: [],
      classification: null,
      ordinal: 0,
    });
    expect(mapped.analyteId).toBeUndefined();
    expect(mapped.unit).toBeUndefined();
    expect(mapped.refLow).toBeUndefined();
    expect(mapped.classification).toBeUndefined();
  });

  it('carries a stored classification through unchanged', () => {
    const mapped = resultRowFromRow({
      id: 'row2',
      report_id: 'r1',
      raw_name: 'Potassium',
      analyte_id: 'potassium',
      value: '6.8',
      unit: 'mmol/L',
      ref_low: 3.5,
      ref_high: 5.1,
      raw_range: null,
      lab_flags: ['HH'],
      low_confidence_fields: [],
      classification: { kind: 'range', band: 'above', critical: true },
      ordinal: 1,
    });
    expect(mapped.classification).toEqual({ kind: 'range', band: 'above', critical: true });
    expect(mapped.labFlags).toEqual(['HH']);
  });
});

describe('explanationFromRow', () => {
  it('renames columns and maps a missing approved_at to undefined', () => {
    const mapped = explanationFromRow({
      id: 'exp1',
      report_id: 'r1',
      overall_text: 'All typical.',
      per_test: [{ analyteId: 'tsh', text: 'Typical.' }],
      sources: [{ analyteId: 'tsh', title: 'TSH', url: 'https://medlineplus.gov/' }],
      status: 'draft',
      approved_at: null,
    });
    expect(mapped.overallText).toBe('All typical.');
    expect(mapped.approvedAt).toBeUndefined();
    expect(mapped.perTest).toEqual([{ analyteId: 'tsh', text: 'Typical.' }]);
  });
});

describe('shareLinkFromRow', () => {
  it('maps an unopened, live link to openedAt/supersededAt undefined', () => {
    expect(
      shareLinkFromRow({
        id: 'sl1',
        report_id: 'r1',
        token: 'tok',
        expires_at: '2026-10-13T00:00:00Z',
        opened_at: null,
        superseded_at: null,
      }),
    ).toEqual({
      id: 'sl1',
      reportId: 'r1',
      token: 'tok',
      expiresAt: '2026-10-13T00:00:00Z',
      openedAt: undefined,
      supersededAt: undefined,
    });
  });
});

describe('outreachFromRow', () => {
  it('drops the db id (OutreachEntry has none) and renames columns', () => {
    expect(
      outreachFromRow({
        id: 'ou1',
        report_id: 'r1',
        analyte_id: 'potassium',
        method: 'phone',
        note: 'Left a voicemail.',
        at: '2026-07-14T10:00:00Z',
      }),
    ).toEqual({
      reportId: 'r1',
      analyteId: 'potassium',
      method: 'phone',
      note: 'Left a voicemail.',
      at: '2026-07-14T10:00:00Z',
    });
  });
});

describe('inserts omit database-generated ids', () => {
  it('reportToInsert defaults status to uploaded and carries no id', () => {
    const insert = reportToInsert(
      { name: 'Sam Sample', email: 'sam@example.test', dob: '1992-06-30' },
      'sample-ref',
    );
    expect(insert).toEqual({
      patient_name: 'Sam Sample',
      patient_email: 'sam@example.test',
      patient_dob: '1992-06-30',
      pdf_ref: 'sample-ref',
      status: 'uploaded',
    });
    expect('id' in insert).toBe(false);
  });

  it('resultRowToInsert maps undefined to null, keeps report_id, and stamps the ordinal', () => {
    const insert = resultRowToInsert(
      'r1',
      {
        id: 'client-supplied-id',
        reportId: 'r1',
        rawName: 'Iron',
        value: '65',
        labFlags: [],
        lowConfidenceFields: [],
      },
      2,
    );
    expect(insert.report_id).toBe('r1');
    expect(insert.analyte_id).toBeNull();
    expect(insert.unit).toBeNull();
    expect(insert.classification).toBeNull();
    expect(insert.ordinal).toBe(2);
    expect('id' in insert).toBe(false);
  });

  it('outreachToInsert keys by report_id + analyte_id', () => {
    expect(
      outreachToInsert('r1', {
        reportId: 'r1',
        analyteId: 'potassium',
        method: 'other',
        note: 'Spoke in person.',
        at: '2026-07-14T10:00:00Z',
      }),
    ).toEqual({
      report_id: 'r1',
      analyte_id: 'potassium',
      method: 'other',
      note: 'Spoke in person.',
      at: '2026-07-14T10:00:00Z',
    });
  });
});
