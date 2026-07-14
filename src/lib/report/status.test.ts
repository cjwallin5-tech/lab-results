import { describe, expect, it } from "vitest";
import { assertTransition, canTransition, isPatientVisible } from "./status";

describe("report status machine", () => {
  it("allows each forward step in the workflow", () => {
    expect(canTransition("uploaded", "extracted")).toBe(true);
    expect(canTransition("extracted", "verified")).toBe(true);
    expect(canTransition("verified", "drafted")).toBe(true);
    expect(canTransition("drafted", "approved")).toBe(true);
    expect(canTransition("approved", "sent")).toBe(true);
  });

  it("rejects skipping a step", () => {
    expect(canTransition("uploaded", "approved")).toBe(false);
    expect(canTransition("verified", "sent")).toBe(false);
  });

  it("rejects moving backward", () => {
    expect(canTransition("approved", "drafted")).toBe(false);
    expect(canTransition("sent", "approved")).toBe(false);
  });

  it("assertTransition throws on an illegal jump", () => {
    expect(() => assertTransition("uploaded", "sent")).toThrow(/Illegal report status transition/);
  });

  it("marks a report patient-visible only once approved or sent", () => {
    expect(isPatientVisible("drafted")).toBe(false);
    expect(isPatientVisible("approved")).toBe(true);
    expect(isPatientVisible("sent")).toBe(true);
  });
});
