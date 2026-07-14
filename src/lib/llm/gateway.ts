import { readFileSync } from "node:fs";
import { join } from "node:path";
import { generateObject } from "ai";
import {
  draftResultSchema,
  extractionSchema,
  type DraftInput,
  type DraftResult,
  type ExtractionResult,
} from "./schemas";

/**
 * The live LLM path via the Vercel AI Gateway. Selected only when a gateway key
 * and LLM_MODEL are set; the model is a "provider/model" gateway string so the
 * provider can be swapped without a code change. This path is written but is
 * exercised only with real credentials: it is not covered by the offline tests
 * or CI, and must be validated on a spike before any real use.
 */

const LIB_DIR = join(process.cwd(), "src/lib");

function loadPrompt(relativePath: string): string {
  return readFileSync(join(LIB_DIR, relativePath), "utf8");
}

function requireModel(): string {
  const model = process.env.LLM_MODEL;
  if (!model) throw new Error("LLM_MODEL must be set to use the live LLM path");
  return model;
}

export async function liveExtract(input: {
  pdfRef: string;
  pdfBytes?: Uint8Array;
}): Promise<ExtractionResult> {
  if (input.pdfBytes === undefined) {
    throw new Error("Live extraction requires the report PDF bytes");
  }
  const { object } = await generateObject({
    model: requireModel(),
    schema: extractionSchema,
    system: loadPrompt("llm/extract-prompt.md"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Transcribe every test line from this lab report as structured rows. Add no medical knowledge.",
          },
          { type: "file", data: input.pdfBytes, mediaType: "application/pdf" },
        ],
      },
    ],
  });
  return object;
}

export async function liveDraft(input: DraftInput): Promise<DraftResult> {
  const { object } = await generateObject({
    model: requireModel(),
    schema: draftResultSchema,
    system: loadPrompt("draft/prompt.md"),
    prompt: JSON.stringify({ classified: input.classified, sources: input.sources }, null, 2),
  });
  return object;
}
