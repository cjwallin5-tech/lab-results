import { z } from "zod";

/**
 * Zod schemas for the human-entered inputs that cross a trust boundary. The
 * TypeScript interfaces in ./types.ts are the internal contract; these validate
 * what arrives from a form before it becomes one of those shapes.
 */

/** ISO calendar date, YYYY-MM-DD, that is also a real day. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date as YYYY-MM-DD")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
  }, "That is not a real calendar date");

/** Provider-entered patient details on the upload screen (synthetic in v1). */
export const uploadMetadataSchema = z.object({
  name: z.string().trim().min(1, "Enter the patient's name"),
  email: z.string().trim().email("Enter a valid email address"),
  dob: isoDateSchema,
});

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;

/** The patient's DOB entry on the share-link gate, split across three fields. */
export const dobEntrySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  day: z.coerce.number().int().min(1).max(31),
  year: z.coerce.number().int().min(1900).max(2100),
});

export type DobEntry = z.infer<typeof dobEntrySchema>;

/** Compose a DOB entry into the canonical YYYY-MM-DD form for comparison. */
export function dobEntryToIso(entry: DobEntry): string {
  const mm = String(entry.month).padStart(2, "0");
  const dd = String(entry.day).padStart(2, "0");
  return `${entry.year}-${mm}-${dd}`;
}
