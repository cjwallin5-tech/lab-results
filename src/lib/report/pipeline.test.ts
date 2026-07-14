import { describe, expect, it } from "vitest";
import { summarizeResults } from "./pipeline";
import type { ResultRow } from "@/lib/model/types";

function row(classification: ResultRow["classification"]): ResultRow {
  return { reportId: "r", rawName: "x", value: "1", labFlags: [], lowConfidenceFields: [], classification };
}

describe("summarizeResults", () => {
  it("buckets classified rows into in range, out of range, critical, and not covered", () => {
    const rows = [
      row({ kind: "placed", position: "in", critical: false }),
      row({ kind: "placed", position: "in", critical: false }),
      row({ kind: "placed", position: "above", critical: false }),
      row({ kind: "placed", position: "above", critical: true }),
      row({ kind: "not-covered" }),
      row({ kind: "implausible" }),
    ];
    expect(summarizeResults(rows)).toEqual({
      total: 6,
      inRange: 2,
      outOfRange: 1,
      critical: 1,
      notCovered: 1,
    });
  });

  it("counts a critical result as critical, not out of range", () => {
    const summary = summarizeResults([row({ kind: "placed", position: "above", critical: true })]);
    expect(summary.critical).toBe(1);
    expect(summary.outOfRange).toBe(0);
  });
});
