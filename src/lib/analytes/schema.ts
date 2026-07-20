/**
 * Schema for the analyte dictionary (SPEC.md §Data model — AnalyteEntry). CI validates
 * every entry against this so a malformed or physiologically incoherent dictionary entry
 * fails the build, not the runtime (CLAUDE.md "Code conventions").
 */

import { z } from 'zod';

export const analyteEntrySchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'id must be a lowercase-kebab slug'),
    loinc: z.string().regex(/^\d+-\d$/, 'loinc must look like "718-7"'),
    displayName: z.string().min(1),
    aliases: z.array(z.string().min(1)),
    medlineplusUrl: z.string().url().startsWith('https://medlineplus.gov/'),
    unit: z.string().min(1),
    criticalLow: z.number().optional(),
    criticalHigh: z.number().optional(),
    plausibleLow: z.number().optional(),
    plausibleHigh: z.number().optional(),
  })
  .strict()
  .refine((e) => e.criticalLow === undefined || e.criticalHigh === undefined || e.criticalLow < e.criticalHigh, {
    message: 'criticalLow must be less than criticalHigh',
  })
  .refine(
    (e) => e.plausibleLow === undefined || e.plausibleHigh === undefined || e.plausibleLow < e.plausibleHigh,
    { message: 'plausibleLow must be less than plausibleHigh' },
  )
  .refine((e) => e.criticalLow === undefined || e.plausibleLow === undefined || e.plausibleLow <= e.criticalLow, {
    message: 'plausibleLow must be at or below criticalLow — a critical value can never be flagged implausible',
  })
  .refine(
    (e) => e.criticalHigh === undefined || e.plausibleHigh === undefined || e.plausibleHigh >= e.criticalHigh,
    { message: 'plausibleHigh must be at or above criticalHigh — a critical value can never be flagged implausible' },
  );

export type AnalyteEntryInput = z.infer<typeof analyteEntrySchema>;
