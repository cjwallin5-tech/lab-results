import { describe, expect, it } from "vitest";
import { findUnreviewed } from "../scripts/content-gate.mjs";

const reviewed = {
  analyte_id: "hemoglobin",
  what_it_measures: "Hemoglobin is the protein in red blood cells that carries oxygen.",
  reviewed_by: "Daniel Castillo",
  reviewed_date: "2026-07-09",
};

describe("content-review gate (FR-13)", () => {
  it("passes entries a human has approved", () => {
    expect(findUnreviewed([reviewed])).toEqual([]);
  });

  it("flags entries with reviewed_by null", () => {
    const unreviewed = { ...reviewed, analyte_id: "glucose", reviewed_by: null };
    expect(findUnreviewed([reviewed, unreviewed])).toEqual(["glucose"]);
  });

  it("flags entries with reviewed_by missing entirely", () => {
    const missingField = { ...reviewed };
    delete missingField.reviewed_by;
    expect(findUnreviewed([missingField])).toEqual(["hemoglobin"]);
  });

  it("passes an empty library, before any content is written", () => {
    expect(findUnreviewed([])).toEqual([]);
  });
});
