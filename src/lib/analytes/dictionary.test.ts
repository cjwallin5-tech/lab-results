import { describe, expect, it } from 'vitest';
import { ANALYTE_DICTIONARY } from './dictionary';
import { analyteEntrySchema } from './schema';

describe('ANALYTE_DICTIONARY', () => {
  it('has exactly 15 entries', () => {
    expect(ANALYTE_DICTIONARY).toHaveLength(15);
  });

  it('every entry satisfies analyteEntrySchema', () => {
    for (const entry of ANALYTE_DICTIONARY) {
      const result = analyteEntrySchema.safeParse(entry);
      if (!result.success) {
        throw new Error(`${entry.id}: ${result.error.message}`);
      }
    }
  });

  it('has unique, stable-slug ids', () => {
    const ids = ANALYTE_DICTIONARY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no alias claimed by more than one entry', () => {
    const seen = new Map<string, string>();
    for (const entry of ANALYTE_DICTIONARY) {
      for (const alias of new Set(entry.aliases.map((a) => a.toLowerCase()))) {
        const owner = seen.get(alias);
        if (owner && owner !== entry.id) {
          throw new Error(`alias "${alias}" claimed by both ${owner} and ${entry.id}`);
        }
        seen.set(alias, entry.id);
      }
    }
  });

  it('every medlineplusUrl is unique', () => {
    const urls = ANALYTE_DICTIONARY.map((e) => e.medlineplusUrl);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
