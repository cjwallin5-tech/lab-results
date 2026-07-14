import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Report } from "@/lib/model/types";
import type { DbState } from "./local-adapter";

/**
 * Builds the initial store state from committed synthetic seed data. Providers
 * see these reports on first run so the workflow can be walked end to end
 * without any real upload.
 */
export function buildSeedState(): DbState {
  const reportsPath = join(process.cwd(), "src/data/seed/reports.json");
  const reports = JSON.parse(readFileSync(reportsPath, "utf8")) as Report[];
  return {
    reports,
    rows: {},
    explanations: {},
    shareLinks: [],
  };
}
