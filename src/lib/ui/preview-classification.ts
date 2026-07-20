import type { Classification } from '@/lib/types';

/**
 * A lightweight, client-safe preview of how an edited value lands on its printed
 * range, so the provider sees the effect of a correction on the verify screen.
 * This is only a preview: the authoritative classification (including critical
 * and implausible thresholds, which need the dictionary) is computed by the
 * pipeline's deterministic classifier after the provider confirms.
 */
export function previewClassification(row: {
  analyteId?: string;
  value: string;
  refLow?: number;
  refHigh?: number;
}): Classification {
  if (row.analyteId === undefined || row.analyteId.trim() === '') {
    return { kind: 'not-covered' };
  }
  const value = Number(row.value.replace(/,/g, ''));
  if (row.value.trim() === '' || !Number.isFinite(value)) {
    return { kind: 'unclassifiable', reason: 'non-numeric' };
  }
  if (row.refLow === undefined && row.refHigh === undefined) {
    return { kind: 'unclassifiable', reason: 'no-range' };
  }
  if (row.refLow !== undefined && value < row.refLow) {
    return { kind: 'range', band: 'below', critical: false };
  }
  if (row.refHigh !== undefined && value > row.refHigh) {
    return { kind: 'range', band: 'above', critical: false };
  }
  return { kind: 'range', band: 'in', critical: false };
}
