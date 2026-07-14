import { z } from "zod";
import type { Classification } from "@/lib/model/types";

/**
 * Contracts for the two LLM steps. The model's JSON is untrusted input, so both
 * the offline fixtures and any live response are validated through these before
 * anything downstream touches them. A fixture that would fail here fails CI.
 */

/** One transcribed test line, exactly as printed. No analyte match or classification yet. */
export const extractedRowSchema = z.object({
  rawName: z.string().min(1),
  value: z.string(),
  unit: z.string().optional(),
  refLow: z.string().optional(),
  refHigh: z.string().optional(),
  rawRange: z.string().optional(),
  labFlags: z.array(z.string()).default([]),
  lowConfidenceFields: z.array(z.string()).default([]),
});

export const extractionSchema = z.object({
  rows: z.array(extractedRowSchema),
});

export type ExtractedRow = z.infer<typeof extractedRowSchema>;
export type ExtractionResult = z.infer<typeof extractionSchema>;

/** The drafter's output: an overall synthesis plus one entry per test. */
export const draftResultSchema = z.object({
  overallText: z.string().min(1),
  perTest: z.array(
    z.object({
      analyteId: z.string().min(1),
      text: z.string().min(1),
    }),
  ),
});

export type DraftResult = z.infer<typeof draftResultSchema>;

/** A MedlinePlus source handed to the drafter as grounding for one analyte. */
export interface DraftSource {
  analyteId: string;
  url: string;
  text: string;
}

/** What the drafter may use: classifications and MedlinePlus text only. */
export interface ClassifiedRowSummary {
  analyteId: string;
  displayName: string;
  panel: string;
  value: string;
  unit?: string;
  classification: Classification;
}

export interface DraftInput {
  reportId: string;
  classified: ClassifiedRowSummary[];
  sources: DraftSource[];
}

/** The drafter's result with the MedlinePlus attribution URLs attached. */
export interface DraftedContent {
  overallText: string;
  perTest: { analyteId: string; text: string }[];
  sources: string[];
}
