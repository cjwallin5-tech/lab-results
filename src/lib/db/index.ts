import { join } from "node:path";
import { LocalRepository } from "./local-adapter";
import { buildSeedState } from "./seed";
import type { Repository } from "./repository";

/**
 * Returns the process-wide repository. The local file adapter backs synthetic
 * data now; a Supabase adapter selected on `SUPABASE_URL` slots in here later
 * without touching any call site. The instance is cached on globalThis so Next
 * dev hot-reloads reuse one store instead of reseeding every request.
 */

const DB_PATH = join(process.cwd(), ".data", "db.json");

const globalForDb = globalThis as unknown as { repository?: Repository };

export function getRepository(): Repository {
  if (globalForDb.repository === undefined) {
    globalForDb.repository = new LocalRepository(buildSeedState(), DB_PATH);
  }
  return globalForDb.repository;
}

export type { Repository, NewReport } from "./repository";
