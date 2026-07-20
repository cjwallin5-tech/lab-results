/**
 * Extraction-corpus generator. Renders each synthetic scenario to a real,
 * text-layer PDF (via headless Chromium's page.pdf(), which Playwright already
 * provides for E2E — no new dependency) and writes a DRAFT answer key for review.
 *
 * Run with `npm run gen:corpus`. Needs no secrets or dev server.
 *
 * Outputs, per scenario:
 *   tests/extraction/<id>/report.pdf   — the rendered report (committed)
 *   scratch/corpus/<id>.expected.json  — a DRAFT answer key (git-ignored)
 *
 * This script writes ONLY report.pdf into tests/extraction/. It never writes
 * expected.json there: the answer key is human-verified ground truth (CLAUDE.md
 * freeze rule), so the owner reviews each draft in scratch/ against the rendered
 * PDF and hand-copies the reviewed key into tests/extraction/<id>/expected.json.
 * Keeping the generator out of that path means a later template tweak + rerun can
 * never silently rewrite a frozen key.
 *
 * The rendered PDF bytes are NOT reproducible (Chromium embeds timestamps), so the
 * PDF is a committed artifact, not a byte-frozen one; only expected.json is frozen.
 * Regenerating a report.pdf therefore requires re-verifying its expected.json.
 *
 * Synthetic data only (FR-15): the summary prints scenario ids and row counts,
 * never patient DOBs (safety rule 5).
 */

import { chromium } from 'playwright';
import { format, resolveConfig } from 'prettier';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SCENARIOS } from './scenarios';
import { renderQuestHtml } from './layouts/quest';
import { renderLabcorpHtml } from './layouts/labcorp';
import { draftAnswerKey } from './expected';

const CORPUS_DIR = join(process.cwd(), 'tests/extraction');
const DRAFT_DIR = join(process.cwd(), 'scratch/corpus');

async function main(): Promise<void> {
  await mkdir(DRAFT_DIR, { recursive: true });

  // Emit drafts formatted exactly as the repo's Prettier would, so the key the
  // owner copies into the format-checked tests/extraction/ passes format:check
  // with no extra step.
  const prettierConfig = (await resolveConfig(process.cwd())) ?? {};

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const scenario of SCENARIOS) {
      const html =
        scenario.layout === 'quest' ? renderQuestHtml(scenario) : renderLabcorpHtml(scenario);
      await page.setContent(html, { waitUntil: 'networkidle' });

      const scenarioDir = join(CORPUS_DIR, scenario.id);
      await mkdir(scenarioDir, { recursive: true });
      await page.pdf({
        path: join(scenarioDir, 'report.pdf'),
        format: 'Letter',
        printBackground: true,
      });

      const key = draftAnswerKey(scenario);
      const json = await format(JSON.stringify(key), { ...prettierConfig, parser: 'json' });
      await writeFile(join(DRAFT_DIR, `${scenario.id}.expected.json`), json, 'utf8');

      // No DOBs in output (safety rule 5).
      console.log(
        `  ${scenario.id.padEnd(24)} ${scenario.layout.padEnd(8)} ${key.rows.length} rows  → report.pdf + draft key`,
      );
    }
  } finally {
    await browser.close();
  }

  console.log(`\nRendered ${SCENARIOS.length} reports to tests/extraction/<id>/report.pdf`);
  console.log(`Draft answer keys written to scratch/corpus/ — verify each against its PDF,`);
  console.log(`then copy the reviewed key to tests/extraction/<id>/expected.json.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
