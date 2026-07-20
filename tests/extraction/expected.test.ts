/**
 * CI gate for the extraction eval corpus (CLAUDE.md "Planned structure" — tests/extraction/).
 * Every hand-written answer key must parse as ExtractedRow[] and have exactly one PDF
 * counterpart — a malformed or orphaned fixture fails the build, not a future test run.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { extractedRowSchema } from '../../src/lib/types';

const here = dirname(fileURLToPath(import.meta.url));
const pdfsDir = join(here, 'pdfs');
const expectedDir = join(here, 'expected');

const pdfNames = readdirSync(pdfsDir)
  .filter((f) => f.endsWith('.pdf'))
  .map((f) => f.replace(/\.pdf$/, ''))
  .sort();
const expectedNames = readdirSync(expectedDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort();

describe('extraction eval corpus', () => {
  it('has a fixture for every PDF and no orphaned expected files', () => {
    expect(expectedNames).toEqual(pdfNames);
  });

  it('has at least 6 fixtures covering the corpus', () => {
    expect(pdfNames.length).toBeGreaterThanOrEqual(6);
  });

  for (const name of expectedNames) {
    it(`${name}.json parses as ExtractedRow[]`, () => {
      const raw = readFileSync(join(expectedDir, `${name}.json`), 'utf-8');
      const parsed = z.array(extractedRowSchema).safeParse(JSON.parse(raw));
      if (!parsed.success) {
        throw new Error(`${name}.json: ${parsed.error.message}`);
      }
      expect(parsed.data.length).toBeGreaterThan(0);
    });
  }
});
