import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  draftResultSchema,
  extractionSchema,
  type DraftInput,
  type DraftResult,
  type ExtractionResult,
} from "./schemas";

/**
 * The offline LLM path: pre-authored synthetic fixtures instead of a live model
 * call, so the whole flow runs on localhost with no API key. Fixtures pass
 * through the same schemas as a live response, so a malformed fixture fails the
 * same way. This path is for building and previewing only: it does not measure
 * extraction accuracy or grounding.
 */

const SEED_DIR = join(process.cwd(), "src/data/seed");

export function offlineExtract(pdfRef: string): ExtractionResult {
  const path = join(SEED_DIR, "extractions", `${pdfRef}.json`);
  try {
    return extractionSchema.parse(JSON.parse(readFileSync(path, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`No synthetic extraction fixture for pdfRef "${pdfRef}"`);
    }
    throw error;
  }
}

export function offlineDraft(input: DraftInput): DraftResult {
  const path = join(SEED_DIR, "drafts", `${input.reportId}.json`);
  try {
    return draftResultSchema.parse(JSON.parse(readFileSync(path, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`No synthetic draft fixture for report "${input.reportId}"`);
    }
    throw error;
  }
}
