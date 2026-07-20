import type { AnalyteEntry } from '@/lib/types';

/**
 * Pure name matching, safe to run on the client (no filesystem). The dictionary
 * loader and any client-side preview both match printed names through this so
 * their behaviour stays identical.
 */

/** Fold a printed test name to a stable key for alias matching. */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Match a raw printed name to a dictionary entry via its aliases, or undefined. */
export function matchAnalyteIn(entries: AnalyteEntry[], rawName: string): AnalyteEntry | undefined {
  const key = normalizeName(rawName);
  return entries.find((entry) => entry.aliases.some((alias) => normalizeName(alias) === key));
}
