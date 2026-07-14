import { describe, expect, it } from "vitest";
import { criticalAnalyteIds, outstandingOutreach } from "./critical";
import type { Report, ResultRow } from "@/lib/model/types";

function row(analyteId: string | undefined, critical: boolean): ResultRow {
  return {
    reportId: "r",
    rawName: analyteId ?? "x",
    analyteId,
    value: "1",
    labFlags: [],
    lowConfidenceFields: [],
    classification: critical
      ? { kind: "placed", position: "above", critical: true }
      : { kind: "placed", position: "in", critical: false },
  };
}

function report(outreachAnalyteIds: string[]): Report {
  return {
    id: "r",
    patient: { name: "T", email: "t@example.test", dob: "1990-01-01" },
    pdfRef: "ref",
    status: "approved",
    createdAt: "2026-07-13T00:00:00.000Z",
    updatedAt: "2026-07-13T00:00:00.000Z",
    statusHistory: [],
    outreach: outreachAnalyteIds.map((analyteId) => ({
      analyteId,
      method: "phone" as const,
      note: "",
      at: "2026-07-13T00:00:00.000Z",
    })),
    questions: [],
  };
}

describe("critical helpers", () => {
  const rows = [row("potassium", true), row("sodium", false), row("glucose", true)];

  it("lists distinct critical analyte ids", () => {
    expect(criticalAnalyteIds(rows)).toEqual(["potassium", "glucose"]);
  });

  it("reports outstanding outreach until each critical is contacted", () => {
    expect(outstandingOutreach(report([]), rows)).toEqual(["potassium", "glucose"]);
    expect(outstandingOutreach(report(["potassium"]), rows)).toEqual(["glucose"]);
    expect(outstandingOutreach(report(["potassium", "glucose"]), rows)).toEqual([]);
  });

  it("has no outstanding outreach when nothing is critical", () => {
    expect(outstandingOutreach(report([]), [row("sodium", false)])).toEqual([]);
  });
});
