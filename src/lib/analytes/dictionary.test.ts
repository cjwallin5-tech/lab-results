import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyteEntrySchema } from './schema';
import { loadDictionary, matchAnalyte } from './index';

/**
 * Guards the curated dictionary. Every file must satisfy the schema, its
 * filename must match its id, ids/LOINC/aliases must be unambiguous so
 * normalization maps a printed name to exactly one entry, and the static
 * import list in index.ts must cover every JSON file on disk.
 */

const DICTIONARY_DIR = join(process.cwd(), 'src/lib/analytes/data');
const files = readdirSync(DICTIONARY_DIR).filter((file) => file.endsWith('.json'));

function load(file: string) {
  return analyteEntrySchema.parse(JSON.parse(readFileSync(join(DICTIONARY_DIR, file), 'utf8')));
}

describe('analyte dictionary files', () => {
  it('has a reasonable number of entries', () => {
    expect(files.length).toBeGreaterThanOrEqual(15);
  });

  it('are all registered in the loader (no forgotten imports)', () => {
    expect(loadDictionary().length).toBe(files.length);
  });

  for (const file of files) {
    it(`${file} matches the schema and its filename`, () => {
      const entry = load(file);
      expect(`${entry.id}.json`).toBe(file);
    });
  }
});

describe('dictionary integrity', () => {
  const entries = files.map(load);

  it('ids are unique', () => {
    const ids = entries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('LOINC codes are unique', () => {
    const codes = entries.map((entry) => entry.loinc);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('aliases do not collide across entries', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const entry of entries) {
      for (const alias of entry.aliases) {
        const key = alias.trim().toLowerCase().replace(/\s+/g, ' ');
        const owner = seen.get(key);
        if (owner !== undefined && owner !== entry.id) {
          collisions.push(`"${alias}" shared by ${owner} and ${entry.id}`);
        }
        seen.set(key, entry.id);
      }
    }
    expect(collisions).toEqual([]);
  });
});

describe('matchAnalyte', () => {
  it('matches a printed name through alias normalization', () => {
    expect(matchAnalyte('  potassium ')?.id).toBe('potassium');
    expect(matchAnalyte('K+')?.id).toBe('potassium');
  });

  it('returns undefined for an unknown test, never a guess', () => {
    expect(matchAnalyte('Reticulocyte Count')).toBeUndefined();
  });
});
