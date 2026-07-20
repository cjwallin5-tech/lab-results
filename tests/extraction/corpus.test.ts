import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractionSchema } from '@/lib/extract/schema';

/**
 * Guards the extraction corpus (tests/extraction/). This is the piece runnable
 * without an ANTHROPIC_API_KEY: it does not measure extraction accuracy (that is
 * the eval runner, built during the spike — see README.md), it enforces that
 * every committed answer key still conforms to the extraction contract, so a
 * frozen key cannot silently drift out of shape (the analog of the dictionary's
 * "malformed data fails the build, not runtime" rule).
 *
 * Answer keys are human-verified and added after review (README.md workflow), so
 * a scenario whose key is not yet in place has its schema check skipped rather
 * than failing — the report.pdf presence check always runs.
 */
const CORPUS_DIR = join(process.cwd(), 'tests/extraction');

function scenarioDirs(): string[] {
  return readdirSync(CORPUS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

describe('extraction corpus', () => {
  const dirs = scenarioDirs();

  it('contains at least one scenario', () => {
    expect(dirs.length).toBeGreaterThan(0);
  });

  for (const dir of dirs) {
    const pdfPath = join(CORPUS_DIR, dir, 'report.pdf');
    const keyPath = join(CORPUS_DIR, dir, 'expected.json');
    const hasKey = existsSync(keyPath);

    it(`${dir}: has a rendered report.pdf`, () => {
      expect(existsSync(pdfPath)).toBe(true);
    });

    it.runIf(hasKey)(`${dir}: expected.json conforms to the extraction schema`, () => {
      const parsed = extractionSchema.parse(JSON.parse(readFileSync(keyPath, 'utf8')));
      expect(parsed.rows.length).toBeGreaterThan(0);
      // Transcription only (FR-03): a verified key never carries downstream fields.
      for (const row of parsed.rows) {
        expect(row).not.toHaveProperty('analyteId');
        expect(row).not.toHaveProperty('classification');
      }
    });
  }
});
