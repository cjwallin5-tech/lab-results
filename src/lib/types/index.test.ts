import { describe, expect, it } from 'vitest';

import { extractedRowSchema } from './index';

const validRow = {
  rawName: 'Hemoglobin',
  value: '13.2',
  unit: 'g/dL',
  refLow: 12,
  refHigh: 16,
  rawRange: '12.0-16.0',
  labFlags: [],
  lowConfidenceFields: [],
};

describe('extractedRowSchema', () => {
  it('accepts a valid extracted row', () => {
    const parsed = extractedRowSchema.parse(validRow);
    expect(parsed).toEqual(validRow);
  });

  it('accepts a minimal row (one-sided/absent range, non-numeric value)', () => {
    const parsed = extractedRowSchema.parse({
      rawName: 'HIV Ag/Ab Screen',
      value: 'Negative',
      labFlags: [],
      lowConfidenceFields: ['unit'],
    });
    expect(parsed.value).toBe('Negative');
  });

  it('rejects a row without a rawName', () => {
    expect(extractedRowSchema.safeParse({ ...validRow, rawName: undefined }).success).toBe(false);
    expect(extractedRowSchema.safeParse({ ...validRow, rawName: '' }).success).toBe(false);
  });

  it('rejects a numeric value — transcription is a string, exactly as printed', () => {
    expect(extractedRowSchema.safeParse({ ...validRow, value: 13.2 }).success).toBe(false);
  });

  it('rejects unknown extra keys — the LLM output is untrusted', () => {
    expect(extractedRowSchema.safeParse({ ...validRow, diagnosis: 'anemia' }).success).toBe(false);
  });
});
