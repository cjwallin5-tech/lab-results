import { z } from "zod";
import type { AnalyteEntry } from "@/lib/model/types";

/**
 * Zod schema for a dictionary entry. Malformed reference data must fail the
 * build (validate-dictionary), never surface at runtime. The schema is the
 * single source of truth for what a valid AnalyteEntry file looks like, shared
 * by the runtime loader and the CI validator.
 */
export const analyteEntrySchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id must be a lowercase kebab slug"),
    loinc: z.string().regex(/^\d{1,6}-\d$/, "loinc must look like 1234-5"),
    displayName: z.string().min(1),
    aliases: z.array(z.string().min(1)).min(1),
    medlineplusUrl: z
      .string()
      .url()
      .refine(
        (url) => url.startsWith("https://medlineplus.gov/"),
        "medlineplusUrl must be a medlineplus.gov page",
      ),
    unit: z.string().min(1),
    panel: z.string().min(1),
    criticalLow: z.number().optional(),
    criticalHigh: z.number().optional(),
    plausibleLow: z.number().optional(),
    plausibleHigh: z.number().optional(),
  })
  .refine((entry) => entry.aliases.includes(entry.displayName), {
    message: "aliases must include the displayName",
    path: ["aliases"],
  })
  .refine(
    (entry) =>
      entry.criticalLow === undefined ||
      entry.criticalHigh === undefined ||
      entry.criticalLow < entry.criticalHigh,
    { message: "criticalLow must be below criticalHigh", path: ["criticalLow"] },
  )
  .refine(
    (entry) =>
      entry.plausibleLow === undefined ||
      entry.plausibleHigh === undefined ||
      entry.plausibleLow < entry.plausibleHigh,
    { message: "plausibleLow must be below plausibleHigh", path: ["plausibleLow"] },
  );

// Compile-time guarantee that the schema output matches the shared interface.
type SchemaOut = z.infer<typeof analyteEntrySchema>;
const _typeCheck: SchemaOut extends AnalyteEntry ? true : never = true;
void _typeCheck;
