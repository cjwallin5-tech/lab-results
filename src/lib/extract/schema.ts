import { z } from 'zod';

/**
 * The extraction contract (FR-03). The model's JSON is untrusted input, so both
 * the offline fixtures and any live response are validated through this schema
 * before anything downstream touches them; a malformed fixture fails CI.
 *
 * Extraction is transcription only: one row per printed test line, values and
 * ranges kept verbatim as strings (parsing to numbers and analyte matching
 * happen later, at verification/classification — never here). Fields the model
 * is unsure of are named in `lowConfidenceFields`, never silently filled.
 */
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
