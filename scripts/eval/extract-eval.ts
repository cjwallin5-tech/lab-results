/**
 * Extraction eval runner — the empirical half of SPEC "Definition of done" #2
 * (the extraction accuracy bar). Feeds every synthetic corpus PDF through the
 * REAL live extraction path and scores the result against its frozen answer key,
 * so the accuracy bar is measured, not asserted.
 *
 * This is a spike/calibration tool, run by hand — NOT a CI test:
 *   - it calls the live model (costs API calls, non-deterministic), and
 *   - CI has no ANTHROPIC_API_KEY.
 * So it lives as an opt-in script, like `gen:corpus` / `seed`, never in the
 * vitest suite. `corpus.test.ts` is the CI-safe piece (it schema-checks the keys,
 * no key needed); this measures accuracy.
 *
 * Run:
 *   npm run eval:extract              live run — needs ANTHROPIC_API_KEY in .env.local
 *   npm run eval:extract -- --dry     $0 wiring check: loads modules + reads PDFs, no model call
 *   npm run eval:extract -- --only cmp-quest    score a single scenario
 *
 * It goes through `liveExtract` → `src/lib/llm.ts` (the single vendor boundary,
 * CLAUDE.md), which is `server-only`. Scripts can't import `server-only` modules
 * normally; the npm script runs Node with `--conditions=react-server`, under
 * which the `server-only` package resolves to an empty module. A clean `--dry`
 * load (which asserts `liveExtract` imported as a function) is the proof that
 * neutralization worked AND that it did not disturb how the vendor SDK resolves.
 *
 * Scoring shape is fixed by tests/extraction/README.md ("SCORING") so this is
 * calibration, not design. Reads `expected.json` ONLY — never rewrites a frozen
 * key (CLAUDE.md). Full per-field diffs go to gitignored scratch/ (synthetic data,
 * but keep the habit of not routing lab values elsewhere — safety rule 5).
 */

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { liveExtract } from '@/lib/extract/live';
import { isLiveLLM } from '@/lib/llm';
import { extractionSchema, type ExtractedRow } from '@/lib/extract/schema';

const CORPUS_DIR = join(process.cwd(), 'tests/extraction');
const REPORT_DIR = join(process.cwd(), 'scratch/eval');

/** Optional string fields compared verbatim (README: transcription, not normalization). */
const STRING_FIELDS = ['value', 'unit', 'refLow', 'refHigh', 'rawRange'] as const;
/** Safety-relevant fields the drafted bar scores at >=98% (SPIKE_RESULTS.md). */
const SAFETY_FIELDS = [...STRING_FIELDS, 'labFlags'] as const;

/**
 * Flag tokens that are NOT a flag (README: a Quest `NORMAL` / a blank LabCorp
 * flag is not a flag; only printed abnormal tokens count). Dropped from both
 * sides before the set comparison so a transcribed `NORMAL` is not a mismatch.
 */
const NON_FLAG_TOKENS = new Set(['', 'normal', 'n']);

/** Printed tokens that mark a CRITICAL/panic result (mirror of classify.ts CRITICAL_FLAG_MARKERS). */
const CRITICAL_FLAG_TOKENS = new Set(['hh', 'll', 'crit', 'critical', 'panic']);

const normName = (s: string): string => s.trim().toLowerCase();

function normFlags(flags: string[]): Set<string> {
  return new Set(flags.map((f) => f.trim().toLowerCase()).filter((f) => !NON_FLAG_TOKENS.has(f)));
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((x) => b.has(x));
}

/** Omitted must match omitted; "" is distinct from undefined (README field rule). */
function stringFieldEq(a: string | undefined, b: string | undefined): boolean {
  return a === b;
}

interface FieldDiff {
  scenario: string;
  rawName: string;
  field: string;
  expected: string;
  got: string;
}

interface ScenarioScore {
  id: string;
  rowsExpected: number;
  rowsExtracted: number;
  rowsMatched: number;
  missing: string[]; // expected rawNames with no extracted row
  extra: string[]; // extracted rawNames with no expected row (fabrications — FR-03)
  rawNameExact: number; // matched rows whose rawName matched verbatim
  safetyFieldMatches: number;
  safetyFieldTotal: number; // matchedRows * SAFETY_FIELDS.length
  diffs: FieldDiff[];
}

/** Scenarios that have both a rendered PDF and a frozen answer key. */
function scenarios(only?: string): string[] {
  return readdirSync(CORPUS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((id) => existsSync(join(CORPUS_DIR, id, 'report.pdf')))
    .filter((id) => existsSync(join(CORPUS_DIR, id, 'expected.json')))
    .filter((id) => (only ? id === only : true))
    .sort();
}

function readExpected(id: string): ExtractedRow[] {
  const raw = JSON.parse(readFileSync(join(CORPUS_DIR, id, 'expected.json'), 'utf8'));
  return extractionSchema.parse(raw).rows; // read-only: validate shape, never rewrite
}

function fieldValue(row: ExtractedRow, field: string): string | undefined {
  return (row as unknown as Record<string, string | undefined>)[field];
}

function score(id: string, expected: ExtractedRow[], got: ExtractedRow[]): ScenarioScore {
  const s: ScenarioScore = {
    id,
    rowsExpected: expected.length,
    rowsExtracted: got.length,
    rowsMatched: 0,
    missing: [],
    extra: [],
    rawNameExact: 0,
    safetyFieldMatches: 0,
    safetyFieldTotal: 0,
    diffs: [],
  };

  // Align by normalized rawName, first-unused-wins (handles a repeated name in order).
  const usedGot = new Set<number>();
  for (const exp of expected) {
    const gi = got.findIndex(
      (g, i) => !usedGot.has(i) && normName(g.rawName) === normName(exp.rawName),
    );
    if (gi === -1) {
      s.missing.push(exp.rawName);
      continue;
    }
    usedGot.add(gi);
    const g = got[gi];
    s.rowsMatched += 1;
    if (g.rawName === exp.rawName) s.rawNameExact += 1;

    for (const field of SAFETY_FIELDS) {
      s.safetyFieldTotal += 1;
      let ok: boolean;
      if (field === 'labFlags') {
        ok = setsEqual(normFlags(exp.labFlags), normFlags(g.labFlags));
      } else {
        ok = stringFieldEq(fieldValue(exp, field), fieldValue(g, field));
      }
      if (ok) {
        s.safetyFieldMatches += 1;
      } else {
        const fmt = (row: ExtractedRow): string =>
          field === 'labFlags'
            ? JSON.stringify(row.labFlags)
            : fieldValue(row, field) === undefined
              ? '<omitted>'
              : JSON.stringify(fieldValue(row, field));
        s.diffs.push({
          scenario: id,
          rawName: exp.rawName,
          field,
          expected: fmt(exp),
          got: fmt(g),
        });
      }
    }
  }
  got.forEach((g, i) => {
    if (!usedGot.has(i)) s.extra.push(g.rawName);
  });
  return s;
}

function pct(n: number, d: number): string {
  return d === 0 ? 'n/a' : `${((100 * n) / d).toFixed(1)}%`;
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const onlyIdx = args.indexOf('--only');
  const only = onlyIdx !== -1 ? args[onlyIdx + 1] : undefined;

  const ids = scenarios(only);
  if (ids.length === 0) {
    console.error(
      only
        ? `No scenario "${only}" with both report.pdf and expected.json.`
        : 'No corpus scenarios found.',
    );
    process.exit(1);
  }

  console.log(`Extraction eval — ${ids.length} scenario(s): ${ids.join(', ')}\n`);

  // --dry: prove the wiring at $0. A successful import of liveExtract (a
  // server-only chain) is itself the go/no-go on the --conditions neutralization.
  if (dry) {
    if (typeof liveExtract !== 'function') {
      console.error(
        'FAIL: liveExtract did not import as a function (server-only neutralization broke).',
      );
      process.exit(1);
    }
    for (const id of ids) {
      const exp = readExpected(id);
      const bytes = readFileSync(join(CORPUS_DIR, id, 'report.pdf'));
      console.log(`  ✓ ${id}: expected ${exp.length} rows, report.pdf ${bytes.length} bytes`);
    }
    console.log(
      '\nDry run OK — modules resolved (server-only neutralized), PDFs readable, keys parse.',
    );
    console.log('Run without --dry (with ANTHROPIC_API_KEY set) to score a live extraction.');
    return;
  }

  if (!isLiveLLM()) {
    console.error('No ANTHROPIC_API_KEY — set it in .env.local for a live run (or use --dry).');
    process.exit(1);
  }

  const results: ScenarioScore[] = [];
  for (const id of ids) {
    const expected = readExpected(id);
    const bytes = readFileSync(join(CORPUS_DIR, id, 'report.pdf'));
    process.stdout.write(`  … extracting ${id} `);
    const { rows } = await liveExtract(new Uint8Array(bytes));
    const sc = score(id, expected, rows);
    results.push(sc);
    const rowOk = sc.missing.length === 0 && sc.extra.length === 0;
    console.log(
      `(${sc.rowsMatched}/${sc.rowsExpected} matched, ${sc.extra.length} extra) ${rowOk ? 'rows OK' : 'ROW ISSUE'}`,
    );
  }

  // ---- aggregate ----
  const agg = results.reduce(
    (a, s) => ({
      rowsExpected: a.rowsExpected + s.rowsExpected,
      missing: a.missing + s.missing.length,
      extra: a.extra + s.extra.length,
      matched: a.matched + s.rowsMatched,
      rawNameExact: a.rawNameExact + s.rawNameExact,
      fieldMatch: a.fieldMatch + s.safetyFieldMatches,
      fieldTotal: a.fieldTotal + s.safetyFieldTotal,
    }),
    {
      rowsExpected: 0,
      missing: 0,
      extra: 0,
      matched: 0,
      rawNameExact: 0,
      fieldMatch: 0,
      fieldTotal: 0,
    },
  );

  // Is there any printed critical/panic-flag token anywhere in the corpus keys?
  const criticalFlagRows = results.length
    ? ids.flatMap((id) =>
        readExpected(id)
          .filter((r) => [...normFlags(r.labFlags)].some((f) => CRITICAL_FLAG_TOKENS.has(f)))
          .map((r) => `${id}:${r.rawName}`),
      )
    : [];

  const lines: string[] = [];
  const out = (t = '') => {
    lines.push(t);
    console.log(t);
  };

  out('\n===== Aggregate vs provisional bar (SPIKE_RESULTS.md) =====');
  out(
    `Row fidelity (bar: 0 missing, 0 extra):   ${agg.missing} missing, ${agg.extra} extra  ${agg.missing === 0 && agg.extra === 0 ? '✓' : '✗'}`,
  );
  out(
    `Safety fields exact (bar: >=98%):         ${pct(agg.fieldMatch, agg.fieldTotal)}  (${agg.fieldMatch}/${agg.fieldTotal})`,
  );
  out(
    `rawName exact (bar: >=95%):               ${pct(agg.rawNameExact, agg.matched)}  (${agg.rawNameExact}/${agg.matched})`,
  );
  out(
    `Critical-flag detection (bar: 100%):      ${criticalFlagRows.length === 0 ? 'NO FIXTURE — see caveat' : criticalFlagRows.join(', ')}`,
  );

  out('\n----- Caveats (read before setting the SPEC bar) -----');
  out(
    `• Snapshot, not a verdict: ${agg.rowsExpected} expected rows across ${results.length} scenario(s). Small n — the`,
  );
  out(
    '  same "rule of three" caveat as the original spike applies. Make re-running trivial; re-run before shipping.',
  );
  out(
    '• Critical-flag sub-bar is currently un-exercised: no corpus key carries a printed CRIT/panic token. The',
  );
  out(
    "  critical case (critical-cbc-quest potassium 6.8, flag 'HIGH') is critical by THRESHOLD, not a printed flag.",
  );
  out(
    '  To measure the 100% critical-flag bar, add a fixture with a printed CRIT/HH/panic token, or reframe the bar.',
  );
  out(
    '• labFlags scored as a set with normal-indicators dropped (NORMAL/N/blank), per README. Non-deterministic model:',
  );
  out(
    '  a single live run is one sample; a field at 97% here may be 100% next run. Eyeball the diffs below, do not',
  );
  out('  treat one number as final.');

  // ---- per-field diffs (calibration needs raw misses, not just %) ----
  const allDiffs = results.flatMap((s) => s.diffs);
  out(`\n----- Field diffs (${allDiffs.length}) — expected vs got -----`);
  if (allDiffs.length === 0) out('  (none — every scored field matched)');
  for (const d of allDiffs)
    out(`  [${d.scenario}] ${d.rawName} · ${d.field}: expected ${d.expected}, got ${d.got}`);
  for (const s of results) {
    if (s.missing.length) out(`  [${s.id}] MISSING rows: ${s.missing.join(', ')}`);
    if (s.extra.length) out(`  [${s.id}] EXTRA (fabricated) rows: ${s.extra.join(', ')}`);
  }

  mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = join(REPORT_DIR, 'extract-eval-report.md');
  writeFileSync(reportPath, `# Extraction eval report\n\n\`\`\`\n${lines.join('\n')}\n\`\`\`\n`);
  out(`\nFull report written to ${reportPath} (gitignored).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
