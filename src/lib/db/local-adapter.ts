import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import type { Explanation, Report, ReportStatus, ResultRow, ShareLink } from "@/lib/model/types";
import { assertTransition } from "@/lib/report/status";
import type { NewReport, Repository } from "./repository";

/**
 * File-backed repository for synthetic data. The whole store is a single JSON
 * document, read and written synchronously so concurrent server actions cannot
 * interleave a read-modify-write. This maps one-to-one onto the future Supabase
 * tables; only this file changes when a real database is wired in.
 */

export interface DbState {
  reports: Report[];
  rows: Record<string, ResultRow[]>;
  explanations: Record<string, Explanation>;
  shareLinks: ShareLink[];
}

const SHARE_LINK_TTL_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class LocalRepository implements Repository {
  private state: DbState;

  constructor(
    private readonly seed: DbState,
    private readonly dbPath?: string,
  ) {
    this.state = this.readOrSeed();
  }

  private readOrSeed(): DbState {
    if (this.dbPath !== undefined) {
      try {
        return JSON.parse(readFileSync(this.dbPath, "utf8")) as DbState;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    const seeded = structuredClone(this.seed);
    this.persist(seeded);
    return seeded;
  }

  private persist(state: DbState = this.state): void {
    if (this.dbPath === undefined) return;
    mkdirSync(dirname(this.dbPath), { recursive: true });
    writeFileSync(this.dbPath, `${JSON.stringify(state, null, 2)}\n`);
  }

  private requireReport(id: string): Report {
    const report = this.state.reports.find((candidate) => candidate.id === id);
    if (report === undefined) throw new Error(`No report with id ${id}`);
    return report;
  }

  async createReport(input: NewReport): Promise<Report> {
    const now = new Date().toISOString();
    const report: Report = {
      id: randomUUID(),
      patient: input.patient,
      pdfRef: input.pdfRef,
      status: "uploaded",
      createdAt: now,
      updatedAt: now,
    };
    this.state.reports.push(report);
    this.persist();
    return report;
  }

  async getReport(id: string): Promise<Report | null> {
    return this.state.reports.find((report) => report.id === id) ?? null;
  }

  async listReports(): Promise<Report[]> {
    return [...this.state.reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async setReportStatus(id: string, status: ReportStatus): Promise<Report> {
    const report = this.requireReport(id);
    assertTransition(report.status, status);
    report.status = status;
    report.updatedAt = new Date().toISOString();
    this.persist();
    return report;
  }

  async saveRows(reportId: string, rows: ResultRow[]): Promise<void> {
    this.requireReport(reportId);
    this.state.rows[reportId] = rows;
    this.persist();
  }

  async getRows(reportId: string): Promise<ResultRow[]> {
    return this.state.rows[reportId] ?? [];
  }

  async saveExplanation(explanation: Explanation): Promise<Explanation> {
    this.requireReport(explanation.reportId);
    this.state.explanations[explanation.reportId] = explanation;
    this.persist();
    return explanation;
  }

  async getExplanation(reportId: string): Promise<Explanation | null> {
    return this.state.explanations[reportId] ?? null;
  }

  async createShareLink(reportId: string): Promise<ShareLink> {
    this.requireReport(reportId);
    const link: ShareLink = {
      reportId,
      token: randomBytes(24).toString("base64url"),
      expiresAt: new Date(Date.now() + SHARE_LINK_TTL_DAYS * MS_PER_DAY).toISOString(),
      openedAt: null,
    };
    this.state.shareLinks.push(link);
    this.persist();
    return link;
  }

  async getShareLinkByToken(token: string): Promise<ShareLink | null> {
    return this.state.shareLinks.find((link) => link.token === token) ?? null;
  }

  async markLinkOpened(token: string): Promise<void> {
    const link = this.state.shareLinks.find((candidate) => candidate.token === token);
    if (link === undefined) return;
    if (link.openedAt === null) {
      link.openedAt = new Date().toISOString();
      this.persist();
    }
  }
}
