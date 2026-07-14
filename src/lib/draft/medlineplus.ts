import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getAnalyte } from "@/lib/analytes";
import type { DraftSource } from "@/lib/llm/schemas";

/**
 * Gathers the MedlinePlus grounding for a set of covered analytes. Offline, the
 * source text comes from a fixture file when one exists (otherwise empty, and
 * the drafter runs on the canned draft); the live path would fetch the page.
 * The URL is always the dictionary's attribution link.
 */

const FIXTURE_DIR = join(process.cwd(), "src/data/seed/medlineplus");

function readFixtureText(analyteId: string): string {
  try {
    return readFileSync(join(FIXTURE_DIR, `${analyteId}.txt`), "utf8").trim();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "";
    throw error;
  }
}

export function gatherSources(analyteIds: string[]): DraftSource[] {
  const sources: DraftSource[] = [];
  const seen = new Set<string>();
  for (const analyteId of analyteIds) {
    if (seen.has(analyteId)) continue;
    seen.add(analyteId);
    const analyte = getAnalyte(analyteId);
    if (analyte === undefined) continue;
    sources.push({
      analyteId,
      url: analyte.medlineplusUrl,
      text: readFixtureText(analyteId),
    });
  }
  return sources;
}
