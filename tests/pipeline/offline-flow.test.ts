import { describe, expect, it } from "vitest";
import type { Report } from "@/lib/model/types";
import { classifyRows, extractRows } from "@/lib/report/pipeline";
import { buildDraft } from "@/lib/draft";

/**
 * End-to-end offline flow (no UI, no credentials): the synthetic extraction
 * fixtures run through normalization and the real classifier, and the canned
 * draft is assembled. Pins the safety-critical states the patient page depends
 * on: critical, implausible, not-covered, unclassifiable.
 */

function report(id: string, pdfRef: string): Report {
  return {
    id,
    patient: { name: "Test", email: "t@example.test", dob: "1990-01-01" },
    pdfRef,
    status: "verified",
    createdAt: "2026-07-13T00:00:00.000Z",
    updatedAt: "2026-07-13T00:00:00.000Z",
    statusHistory: [{ status: "verified", at: "2026-07-13T00:00:00.000Z" }],
  };
}

function byName(rows: { rawName: string }[], name: string) {
  const found = rows.find((row) => row.rawName === name);
  if (!found) throw new Error(`no row named ${name}`);
  return found as (typeof rows)[number] & {
    analyteId?: string;
    classification?: import("@/lib/model/types").Classification;
  };
}

describe("offline pipeline: Alvarez lipid + CBC", () => {
  it("classifies LDL above, total cholesterol in range, and Iron as not covered", async () => {
    const rows = classifyRows(await extractRows(report("rpt-alvarez-lipid-cbc", "alvarez-lipid-cbc")));
    expect(byName(rows, "LDL Cholesterol").classification).toEqual({
      kind: "placed",
      position: "above",
      critical: false,
    });
    expect(byName(rows, "Total Cholesterol").classification).toEqual({
      kind: "placed",
      position: "in",
      critical: false,
    });
    expect(byName(rows, "Iron").classification).toEqual({ kind: "not-covered" });
  });
});

describe("offline pipeline: Chen metabolic + liver", () => {
  it("flags the high potassium as critical", async () => {
    const rows = classifyRows(await extractRows(report("rpt-chen-metabolic-liver", "chen-metabolic-liver")));
    expect(byName(rows, "Potassium").classification).toEqual({
      kind: "placed",
      position: "above",
      critical: true,
    });
    expect(byName(rows, "ALT").classification).toEqual({
      kind: "placed",
      position: "above",
      critical: false,
    });
  });
});

describe("offline pipeline: Okoro thyroid + vitamin D", () => {
  it("classifies low vitamin D, implausible A1c, not-covered ferritin, unclassifiable hemoglobin", async () => {
    const rows = classifyRows(await extractRows(report("rpt-okoro-thyroid-vitd", "okoro-thyroid-vitd")));
    expect(byName(rows, "Vitamin D, 25-Hydroxy").classification).toEqual({
      kind: "placed",
      position: "below",
      critical: false,
    });
    expect(byName(rows, "Hemoglobin A1c").classification).toEqual({ kind: "implausible" });
    expect(byName(rows, "Ferritin").classification).toEqual({ kind: "not-covered" });
    expect(byName(rows, "Hemoglobin").classification).toEqual({ kind: "unclassifiable" });
  });
});

describe("offline draft assembly", () => {
  it("builds a draft explanation grounded in the covered tests", async () => {
    const seedReport = report("rpt-alvarez-lipid-cbc", "alvarez-lipid-cbc");
    const rows = classifyRows(await extractRows(seedReport));
    const explanation = await buildDraft(seedReport, rows);

    expect(explanation.status).toBe("draft");
    expect(explanation.approvedAt).toBeNull();
    expect(explanation.overallText.length).toBeGreaterThan(0);
    expect(explanation.perTest.map((entry) => entry.analyteId)).toContain("ldl-cholesterol");
    // Iron is not covered, so it never gets drafted text.
    expect(explanation.perTest.map((entry) => entry.analyteId)).not.toContain("iron");
    // Sources are the MedlinePlus attribution links for the covered tests.
    expect(explanation.sources.every((url) => url.startsWith("https://medlineplus.gov/"))).toBe(true);
    expect(explanation.sources.length).toBeGreaterThan(0);
  });
});
