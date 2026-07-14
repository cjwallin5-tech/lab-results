import type { Explanation, Report, ResultRow } from "@/lib/model/types";
import { draft } from "@/lib/llm";
import { summarizeForDraft } from "@/lib/report/pipeline";
import { gatherSources } from "./medlineplus";

/**
 * Builds a draft Explanation for a verified report: summarize the covered,
 * classified rows, gather their MedlinePlus sources, and draft from those two
 * inputs only. The result starts as a draft and reaches the patient only after
 * the provider approves it.
 */
export async function buildDraft(report: Report, rows: ResultRow[]): Promise<Explanation> {
  const classified = summarizeForDraft(rows);
  const sources = gatherSources(classified.map((summary) => summary.analyteId));
  const content = await draft({ reportId: report.id, classified, sources });
  return {
    reportId: report.id,
    overallText: content.overallText,
    perTest: content.perTest,
    sources: content.sources,
    status: "draft",
    approvedAt: null,
  };
}
