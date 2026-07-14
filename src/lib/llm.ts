import { offlineDraft, offlineExtract } from "./llm/offline";
import type { DraftInput, DraftedContent, ExtractionResult } from "./llm/schemas";

/**
 * The single LLM vendor boundary. Every extraction and drafting call goes
 * through here; no other file imports the model SDK. When a gateway key and
 * model are configured the live path runs; otherwise the offline synthetic path
 * does, so the app is fully functional on localhost with no credentials.
 */

export function isLiveLLM(): boolean {
  return (
    Boolean(process.env.LLM_MODEL) &&
    Boolean(process.env.AI_GATEWAY_API_KEY ?? process.env.ANTHROPIC_API_KEY)
  );
}

/** Transcribe a report PDF into structured rows (transcription only). */
export async function extract(input: {
  pdfRef: string;
  pdfBytes?: Uint8Array;
}): Promise<ExtractionResult> {
  if (isLiveLLM()) {
    const { liveExtract } = await import("./llm/gateway");
    return liveExtract(input);
  }
  return offlineExtract(input.pdfRef);
}

/**
 * Draft the patient-page content from classifications plus MedlinePlus text.
 * The MedlinePlus URLs are attached here as attribution regardless of path, so
 * the sources line is always the real set of pages for the report's tests.
 */
export async function draft(input: DraftInput): Promise<DraftedContent> {
  const result = isLiveLLM()
    ? await (await import("./llm/gateway")).liveDraft(input)
    : offlineDraft(input);
  const sources = Array.from(new Set(input.sources.map((source) => source.url)));
  return { overallText: result.overallText, perTest: result.perTest, sources };
}
