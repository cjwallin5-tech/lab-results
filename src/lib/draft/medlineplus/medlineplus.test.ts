import { describe, expect, it } from 'vitest';
import { loadDictionary } from '@/lib/analytes';
import { getGrounding, loadGrounding } from './index';

/**
 * Guards the MedlinePlus grounding cache — the drafting layer's sole source of
 * medical prose. The schema (loaded in index.ts) already rejects off-policy
 * entries; these tests assert the cache stays aligned with the dictionary and
 * that excerpts are really present (a silent parsing failure that produced an
 * empty excerpt must not pass as an intentionally-absent one).
 */

const dictionary = loadDictionary();
const grounding = loadGrounding();

describe('medlineplus grounding cache', () => {
  it('has an entry for every dictionary analyte (coverage)', () => {
    const missing = dictionary.filter((entry) => getGrounding(entry.id) === undefined);
    expect(missing.map((e) => e.id)).toEqual([]);
  });

  it('has no orphan entries (every grounding maps to a real analyte)', () => {
    const ids = new Set(dictionary.map((e) => e.id));
    const orphans = grounding.filter((g) => !ids.has(g.analyteId));
    expect(orphans.map((g) => g.analyteId)).toEqual([]);
  });

  // A real MedlinePlus page yields several thousand characters; a much shorter
  // excerpt means extraction broke (e.g. after a page-layout change), not that
  // the page is genuinely short. Floors the maintenance re-run path.
  const MIN_EXCERPT_CHARS = 200;

  it('every entry has a substantial excerpt (catches silent extraction failures)', () => {
    const thin = grounding.filter((g) => (g.excerpt?.length ?? 0) < MIN_EXCERPT_CHARS);
    expect(thin.map((g) => g.analyteId)).toEqual([]);
  });

  it('each url matches the dictionary’s curated medlineplusUrl (catches drift)', () => {
    for (const entry of dictionary) {
      expect(getGrounding(entry.id)?.url).toBe(entry.medlineplusUrl);
    }
  });

  it('no url is an A.D.A.M. encyclopedia (/ency/) page (safety rule 6)', () => {
    const ency = grounding.filter((g) => g.url.includes('/ency/'));
    expect(ency.map((g) => g.analyteId)).toEqual([]);
  });

  it('no excerpt contains leftover HTML tags', () => {
    const withTags = grounding.filter((g) => g.excerpt && /<[^>]+>/.test(g.excerpt));
    expect(withTags.map((g) => g.analyteId)).toEqual([]);
  });

  it('returns undefined for an unknown analyte id', () => {
    expect(getGrounding('not-a-real-analyte')).toBeUndefined();
  });
});
