import { describe, expect, it } from 'vitest';
import { availablePdfRefs, offlineExtract } from './offline';
import { extractionSchema } from './schema';

/**
 * The offline extraction path and the untrusted-input gate (FR-03). The live
 * model path needs a real key and is validated on a spike, not here; this pins
 * that the offline synthetic fixtures parse, that a missing fixture fails loudly
 * rather than silently, and that malformed model JSON is rejected by the schema.
 *
 * These import the offline/schema modules directly (not the package index) so the
 * test never loads the vendor SDK or the `server-only` boundary.
 */

describe('offline extraction', () => {
  it('exposes the synthetic manual-entry fixture', () => {
    expect(availablePdfRefs()).toContain('manual-entry');
  });

  it('transcribes the manual-entry fixture into rows', () => {
    const { rows } = offlineExtract('manual-entry');
    expect(rows.length).toBe(4);
    expect(rows[0].rawName).toBe('Total Cholesterol');
    // Values and ranges stay verbatim strings — parsing happens later.
    expect(rows[0].value).toBe('198');
    expect(typeof rows[0].refHigh).toBe('string');
  });

  it('carries no analyte match or classification (transcription only, FR-03)', () => {
    const { rows } = offlineExtract('manual-entry');
    for (const row of rows) {
      expect(row).not.toHaveProperty('analyteId');
      expect(row).not.toHaveProperty('classification');
    }
  });

  it('flags low-confidence fields rather than dropping them', () => {
    const { rows } = offlineExtract('manual-entry');
    const ldl = rows.find((row) => row.rawName === 'LDL Cholesterol');
    expect(ldl?.lowConfidenceFields).toContain('value');
  });

  it('fails loudly when no fixture matches the pdfRef (never fabricates)', () => {
    expect(() => offlineExtract('no-such-report')).toThrow(/No synthetic extraction fixture/);
  });
});

describe('extraction schema (untrusted model JSON)', () => {
  it('defaults omitted flag/confidence arrays to empty', () => {
    const parsed = extractionSchema.parse({ rows: [{ rawName: 'Glucose', value: '90' }] });
    expect(parsed.rows[0].labFlags).toEqual([]);
    expect(parsed.rows[0].lowConfidenceFields).toEqual([]);
  });

  it('rejects a row with an empty test name', () => {
    expect(() => extractionSchema.parse({ rows: [{ rawName: '', value: '90' }] })).toThrow();
  });

  it('rejects a payload missing the rows array', () => {
    expect(() => extractionSchema.parse({})).toThrow();
  });
});
