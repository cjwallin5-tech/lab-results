import 'server-only';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { z } from 'zod';

/**
 * The single LLM vendor boundary (CLAUDE.md): no other file calls the model API.
 * The extraction and drafting layers build their prompts and schemas and call
 * through here; this file owns the vendor SDK and nothing else does.
 *
 * v1 calls Anthropic directly through the Vercel AI SDK's Anthropic provider —
 * `anthropic()` reads ANTHROPIC_API_KEY and sends the request straight to the
 * Anthropic API (no gateway hop). The provider is swappable here without any
 * caller change if we later move to the official SDK.
 *
 * `server-only`: this module reads the API key and must never reach the client
 * bundle (matches the src/lib/supabase/server.ts guard).
 */

/** Default model when LLM_MODEL is unset. Override per-environment via LLM_MODEL. */
const DEFAULT_MODEL = 'claude-opus-4-8';

/**
 * Whether the live model path is configured. When false, callers use their
 * offline/synthetic path so the app runs fully on localhost with no credentials.
 */
export function isLiveLLM(): boolean {
  // LLM_OFFLINE forces the offline/synthetic path even when a key is present, so
  // deterministic contexts (the E2E suite, CI) never reach the paid model. It only
  // selects the offline path — it cannot skip a safety gate (the held-critical
  // check and deterministic classification run regardless).
  if (process.env.LLM_OFFLINE === '1') return false;
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** One content part the model reads: printed text, or a document (e.g. a report PDF). */
export type LlmPart =
  { type: 'text'; text: string } | { type: 'file'; data: Uint8Array; mediaType: string };

/**
 * The one call site for the model. Returns output validated against `schema`
 * (the SDK constrains and parses the response), so callers receive typed data
 * and never hand-parse the model's JSON.
 */
export async function generateStructured<T>(input: {
  system: string;
  schema: z.ZodType<T>;
  parts: LlmPart[];
}): Promise<T> {
  const { object } = await generateObject({
    model: anthropic(process.env.LLM_MODEL ?? DEFAULT_MODEL),
    schema: input.schema,
    system: input.system,
    messages: [{ role: 'user', content: input.parts }],
  });
  return object;
}
