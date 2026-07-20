import { getAnalyte } from '@/lib/analytes';

/**
 * Display helpers over the curated analyte dictionary (src/lib/analytes).
 * These keep the screens' lookup surface tiny: a display name with an honest
 * fallback to the raw printed name, and the MedlinePlus attribution link.
 */

export function analyteDisplayName(analyteId: string | undefined, fallback: string): string {
  if (analyteId === undefined) return fallback;
  return getAnalyte(analyteId)?.displayName ?? fallback;
}

export function analyteMedlineplusUrl(analyteId: string | undefined): string | undefined {
  if (analyteId === undefined) return undefined;
  return getAnalyte(analyteId)?.medlineplusUrl;
}
