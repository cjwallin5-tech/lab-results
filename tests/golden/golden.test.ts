import { describe, expect, it } from "vitest";
import cases from "./classify.cases.json";
import { classifyRow, type ClassifyInput } from "@/lib/classify";
import type { AnalyteEntry, Classification } from "@/lib/model/types";

/**
 * The golden classification suite. Each fixture pins one branch of the pure
 * classifier; the whole file must pass 100% for `npm run golden` to be green.
 * Fixtures carry only the analyte fields the classifier reads (id, unit,
 * thresholds); the non-classifier fields are filled here so the data stays
 * focused on the behaviour under test.
 */

type FixtureAnalyte = Pick<AnalyteEntry, "id" | "unit"> & Partial<AnalyteEntry>;

interface Fixture {
  name: string;
  input: {
    value: string;
    unit?: string;
    refLow?: string;
    refHigh?: string;
    labFlags: string[];
    analyte?: FixtureAnalyte;
  };
  expected: Classification;
}

function toAnalyte(partial: FixtureAnalyte): AnalyteEntry {
  return {
    loinc: "TEST-LOINC",
    displayName: partial.id,
    aliases: [partial.id],
    medlineplusUrl: "https://medlineplus.gov/lab-tests/",
    panel: "Test panel",
    ...partial,
  };
}

describe("golden classification suite", () => {
  for (const fixture of cases as Fixture[]) {
    it(fixture.name, () => {
      const input: ClassifyInput = {
        value: fixture.input.value,
        unit: fixture.input.unit,
        refLow: fixture.input.refLow,
        refHigh: fixture.input.refHigh,
        labFlags: fixture.input.labFlags,
        analyte: fixture.input.analyte ? toAnalyte(fixture.input.analyte) : undefined,
      };
      expect(classifyRow(input)).toEqual(fixture.expected);
    });
  }
});
