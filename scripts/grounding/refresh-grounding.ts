/**
 * MedlinePlus grounding refresh — populates the checked-in grounding cache
 * (`src/lib/draft/medlineplus/grounding.json`) that the drafting layer reads.
 *
 * Why a script and not a draft-time fetch: START_HERE says "cached per analyte",
 * and CLAUDE.md wants drafting deterministic and hermetic. So the network fetch
 * lives here (run by hand, occasionally — like `gen:corpus` / `seed`), and the
 * result is checked in and reviewed before it ever grounds a patient draft.
 *
 * Source of truth for WHICH page per analyte is the analyte dictionary's curated
 * `medlineplusUrl` — a spike showed MedlinePlus Connect keyed by LOINC returns
 * coarser panel/topic pages (potassium -> the whole Electrolyte Panel), so we
 * fetch the analyte-specific page a human already curated instead. The fetched
 * text is public-domain NLM content (never PHI); the CONTENT review of these
 * blurbs (faithfulness, which sections to keep) is the Content Coordinator's.
 *
 * Run:
 *   npm run refresh:grounding           fetch every analyte, rewrite grounding.json
 *   npm run refresh:grounding -- --only potassium   refresh a single analyte
 *
 * Guards (off-policy input can never reach the cache):
 *   - every URL must be under medlineplus.gov and NOT an /ency/ (A.D.A.M.,
 *     licensed) page (CLAUDE.md safety rule 6);
 *   - extraction stops before trailing/non-content sections, which on health-
 *     topic pages includes the "Medical Encyclopedia" (A.D.A.M.) link block;
 *   - analytes whose page yielded a missing or suspiciously short excerpt are
 *     reported, so a parsing failure is visible — never silently cached.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadDictionary } from '@/lib/analytes';
import { groundingCacheSchema, type Grounding } from '@/lib/draft/medlineplus/schema';

const CACHE_PATH = join(process.cwd(), 'src/lib/draft/medlineplus/grounding.json');

/**
 * A real page yields several thousand characters; anything this short is a
 * suspected extraction failure after a MedlinePlus layout change, not a genuine
 * short page. Flagged (not fatal) here and floored in the CI test, since
 * re-running this script is the whole maintenance model.
 */
const MIN_EXCERPT_CHARS = 200;

/**
 * Headings that mark the end of the article's own content. Everything from the
 * first of these onward is dropped: references, "related" cross-links, and — on
 * health-topic pages — the "Medical Encyclopedia" (A.D.A.M.) section we must not
 * ingest. Matched case-insensitively as a substring of the heading text.
 */
const STOP_HEADINGS = [
  'references',
  'related health topics',
  'related medical tests',
  'learn more',
  'clinical trials',
  'journal articles',
  'patient handouts',
  'topic image',
  'medical encyclopedia',
  'national institutes of health',
  'find an expert',
  'start here',
  'disclaimers',
];

/** Minimal HTML-entity decode for prose — no parser dependency, run-occasionally script. */
function decodeEntities(text: string): string {
  const named: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&rsquo;': '’',
    '&lsquo;': '‘',
    '&rdquo;': '”',
    '&ldquo;': '“',
    '&mdash;': '—',
    '&ndash;': '–',
  };
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&[a-z]+;/gi, (m) => named[m.toLowerCase()] ?? m);
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

/** The page <title>, trimmed — used verbatim in the sources line. */
function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripTags(m[1]) : '';
}

/**
 * The article's own body text, with `## ` section headings preserved so the
 * Content Coordinator can trim by section (e.g. keep or cut "What do the results
 * mean?"). Anchors on <article> to drop the .gov banner/nav, walks block
 * elements in document order, and stops at the first trailing/non-content
 * heading (see STOP_HEADINGS). Returns '' when nothing extractable is found.
 */
function extractExcerpt(html: string): string {
  const article = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const body = article ? article[1] : html;
  const blocks = [...body.matchAll(/<(h2|h3|p|li)[^>]*>([\s\S]*?)<\/\1>/gi)];
  const out: string[] = [];
  let pendingHeading: string | null = null;
  for (const [, tag, inner] of blocks) {
    const text = stripTags(inner);
    if (!text) continue;
    if (/^h[23]$/i.test(tag)) {
      if (STOP_HEADINGS.some((s) => text.toLowerCase().includes(s))) break;
      // Defer headings so an empty section (heading with no body) is dropped.
      pendingHeading = text;
    } else {
      if (pendingHeading) {
        out.push('## ' + pendingHeading);
        pendingHeading = null;
      }
      out.push(text);
    }
  }
  return out.join('\n').trim();
}

async function fetchGrounding(analyteId: string, url: string): Promise<Grounding> {
  if (!url.startsWith('https://medlineplus.gov/') || url.includes('/ency/')) {
    throw new Error(`Refusing to fetch off-policy URL for ${analyteId}: ${url}`);
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': 'lab-result-explainer/grounding-refresh' },
  });
  if (!res.ok) throw new Error(`Fetch failed for ${analyteId} (${url}): HTTP ${res.status}`);
  const html = await res.text();
  const excerpt = extractExcerpt(html);
  return {
    analyteId,
    title: extractTitle(html) || analyteId,
    url,
    ...(excerpt ? { excerpt } : {}),
  };
}

async function main(): Promise<void> {
  const onlyIdx = process.argv.indexOf('--only');
  const only = onlyIdx !== -1 ? process.argv[onlyIdx + 1] : undefined;

  const dictionary = loadDictionary().filter((entry) => !only || entry.id === only);
  if (only && dictionary.length === 0) throw new Error(`No analyte with id "${only}"`);

  // Start from the existing cache so `--only` updates one entry without dropping the rest.
  const existing: Grounding[] = only
    ? groundingCacheSchema.parse(JSON.parse(readFileSync(CACHE_PATH, 'utf8')))
    : [];
  const byId = new Map(existing.map((e) => [e.analyteId, e]));

  const suspect: string[] = [];
  for (const entry of dictionary) {
    process.stdout.write(`  ${entry.id} … `);
    const grounding = await fetchGrounding(entry.id, entry.medlineplusUrl);
    byId.set(entry.id, grounding);
    const len = grounding.excerpt?.length ?? 0;
    if (len < MIN_EXCERPT_CHARS) suspect.push(entry.id);
    console.log(len === 0 ? 'NO EXCERPT' : `${len} chars`);
  }

  const cache = [...byId.values()].sort((a, b) => a.analyteId.localeCompare(b.analyteId));
  groundingCacheSchema.parse(cache); // fail before writing if anything is off-policy
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n');

  console.log(`\nWrote ${cache.length} entries to ${CACHE_PATH}`);
  if (suspect.length > 0) {
    console.log(
      `⚠ ${suspect.length} analyte(s) missing or under ${MIN_EXCERPT_CHARS} chars: ${suspect.join(', ')}`,
    );
    console.log(
      '  (likely an extraction failure after a page-layout change — verify these pages.)',
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
