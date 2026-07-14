import { describe, expect, it } from "vitest";
import { LocalRepository, type DbState } from "./local-adapter";
import type { ResultRow } from "@/lib/model/types";

function emptyState(): DbState {
  return { reports: [], rows: {}, explanations: {}, shareLinks: [] };
}

function newRepo() {
  return new LocalRepository(emptyState());
}

const patient = { name: "Test Patient", email: "test@example.test", dob: "1990-01-01" };

describe("LocalRepository", () => {
  it("creates a report at 'uploaded' and reads it back", async () => {
    const repo = newRepo();
    const created = await repo.createReport({ patient, pdfRef: "ref-1" });
    expect(created.status).toBe("uploaded");
    expect(await repo.getReport(created.id)).toEqual(created);
    expect(await repo.listReports()).toHaveLength(1);
  });

  it("advances status through the machine and rejects illegal jumps", async () => {
    const repo = newRepo();
    const report = await repo.createReport({ patient, pdfRef: "ref-1" });
    await repo.setReportStatus(report.id, "extracted");
    const verified = await repo.setReportStatus(report.id, "verified");
    expect(verified.status).toBe("verified");
    await expect(repo.setReportStatus(report.id, "sent")).rejects.toThrow(/Illegal/);
  });

  it("records an append-only status history", async () => {
    const repo = newRepo();
    const report = await repo.createReport({ patient, pdfRef: "ref-1" });
    await repo.setReportStatus(report.id, "extracted");
    const verified = await repo.setReportStatus(report.id, "verified");
    expect(verified.statusHistory.map((event) => event.status)).toEqual([
      "uploaded",
      "extracted",
      "verified",
    ]);
  });

  it("patches the provider note and result summary", async () => {
    const repo = newRepo();
    const report = await repo.createReport({ patient, pdfRef: "ref-1" });
    const updated = await repo.updateReport(report.id, {
      providerNote: "Called the patient.",
      resultSummary: { total: 3, inRange: 2, outOfRange: 0, critical: 1, notCovered: 0 },
    });
    expect(updated.providerNote).toBe("Called the patient.");
    expect(updated.resultSummary?.critical).toBe(1);
    expect((await repo.getReport(report.id))?.status).toBe("uploaded");
  });

  it("stores and returns result rows and an explanation", async () => {
    const repo = newRepo();
    const report = await repo.createReport({ patient, pdfRef: "ref-1" });
    const rows: ResultRow[] = [
      { reportId: report.id, rawName: "Glucose", value: "92", labFlags: [], lowConfidenceFields: [] },
    ];
    await repo.saveRows(report.id, rows);
    expect(await repo.getRows(report.id)).toEqual(rows);

    const explanation = await repo.saveExplanation({
      reportId: report.id,
      overallText: "Overall text.",
      perTest: [{ analyteId: "glucose", text: "Per-test." }],
      sources: ["https://medlineplus.gov/lab-tests/blood-glucose-test/"],
      status: "approved",
      approvedAt: "2026-07-14T00:00:00.000Z",
    });
    expect(await repo.getExplanation(report.id)).toEqual(explanation);
  });

  it("creates an unguessable share link and marks it opened once", async () => {
    const repo = newRepo();
    const report = await repo.createReport({ patient, pdfRef: "ref-1" });
    const link = await repo.createShareLink(report.id);
    expect(link.token.length).toBeGreaterThanOrEqual(24);
    expect(link.openedAt).toBeNull();

    const found = await repo.getShareLinkByToken(link.token);
    expect(found?.reportId).toBe(report.id);

    await repo.markLinkOpened(link.token);
    const opened = await repo.getShareLinkByToken(link.token);
    expect(opened?.openedAt).not.toBeNull();
  });
});
