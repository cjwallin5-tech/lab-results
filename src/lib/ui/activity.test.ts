import { describe, expect, it } from "vitest";
import { buildActivity, buildWorklist, hasOutreachPending } from "./activity";
import type { Report } from "@/lib/model/types";

function baseReport(over: Partial<Report>): Report {
  return {
    id: "r1",
    patient: { name: "Pat", email: "p@example.test", dob: "1990-01-01" },
    pdfRef: "ref",
    status: "uploaded",
    createdAt: "2026-07-13T10:00:00.000Z",
    updatedAt: "2026-07-13T10:00:00.000Z",
    statusHistory: [{ status: "uploaded", at: "2026-07-13T10:00:00.000Z" }],
    outreach: [],
    questions: [],
    ...over,
  };
}

describe("worklist", () => {
  it("flags drafts, outreach-pending criticals, ready-to-send, and questions", () => {
    const draft = baseReport({ id: "d", status: "drafted" });
    const criticalPending = baseReport({
      id: "c",
      status: "approved",
      resultSummary: { total: 3, inRange: 2, outOfRange: 0, critical: 1, notCovered: 0 },
    });
    const readyToSend = baseReport({ id: "s", status: "approved" });
    const withQuestion = baseReport({ id: "q", status: "sent", questions: [{ text: "?", at: "x" }] });

    const labels = buildWorklist([draft, criticalPending, readyToSend, withQuestion]).map((i) => i.label);
    expect(labels).toContain("Draft ready to review");
    expect(labels).toContain("Critical results need a direct call");
    expect(labels).toContain("Approved, ready to send");
    expect(labels).toContain("1 question from the patient");
  });

  it("hasOutreachPending is true only when critical calls remain", () => {
    const pending = baseReport({
      status: "approved",
      resultSummary: { total: 1, inRange: 0, outOfRange: 0, critical: 1, notCovered: 0 },
    });
    expect(hasOutreachPending(pending)).toBe(true);
    expect(
      hasOutreachPending({
        ...pending,
        outreach: [{ analyteId: "potassium", method: "phone", note: "", at: "x" }],
      }),
    ).toBe(false);
  });
});

describe("activity feed", () => {
  it("merges events across reports newest first", () => {
    const report = baseReport({
      statusHistory: [
        { status: "uploaded", at: "2026-07-13T10:00:00.000Z" },
        { status: "extracted", at: "2026-07-13T11:00:00.000Z" },
      ],
      questions: [{ text: "?", at: "2026-07-13T12:00:00.000Z" }],
    });
    const feed = buildActivity([report], []);
    expect(feed[0].at).toBe("2026-07-13T12:00:00.000Z");
    expect(feed[0].label).toBe("Patient asked a question");
    expect(feed.at(-1)?.at).toBe("2026-07-13T10:00:00.000Z");
  });
});
