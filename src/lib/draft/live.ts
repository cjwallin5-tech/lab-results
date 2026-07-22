import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateStructured } from '@/lib/llm';
import { draftOutputSchema, type DraftInputRow, type DraftOutput } from './schema';

/**
 * The live drafting path: one model call that writes the patient explanation,
 * through the single vendor boundary in src/lib/llm.ts. Grounded ONLY in the
 * classifications + MedlinePlus text carried on each input row (FR-09, safety
 * rule 1); the model adds no medical knowledge of its own and never decides a
 * classification (rule 3).
 *
 * Loaded dynamically by index.ts so the offline path never pulls in the vendor
 * SDK or `server-only`. Not covered by the offline tests or CI — validate on a
 * spike with a real key before any real use.
 *
 * The prompt is a content file (CLAUDE.md), owned by the Content Coordinator and
 * read at call time — never inlined. Its path is added to next.config.ts
 * `outputFileTracingIncludes` so it ships in the serverless bundle on Vercel.
 */
const PROMPT_PATH = join(process.cwd(), 'src/lib/draft/prompt.md');

export async function liveDraft(input: DraftInputRow[]): Promise<DraftOutput> {
  const system = readFileSync(PROMPT_PATH, 'utf8');
  const result = await generateStructured({
    system,
    schema: draftOutputSchema,
    parts: [{ type: 'text', text: JSON.stringify({ rows: input }, null, 2) }],
  });
  // generateStructured already validates against the schema; re-parse so the live
  // and offline paths both return through the same untrusted-input gate.
  return draftOutputSchema.parse(result);
}
