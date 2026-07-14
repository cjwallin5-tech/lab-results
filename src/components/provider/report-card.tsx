import Link from "next/link";
import type { Report } from "@/lib/model/types";
import { reportStatusDisplay } from "@/lib/ui/report-status-display";
import { StatusPill } from "@/components/ui/status-pill";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** A report row on the provider dashboard, with result badges once verified. */
export function ReportCard({ report }: { report: Report }) {
  const status = reportStatusDisplay(report.status);
  const summary = report.resultSummary;

  return (
    <Link
      href={`/provider/reports/${report.id}`}
      className="block rounded-[var(--radius-card)] border border-line bg-paper px-5 py-4 transition-colors hover:border-forest/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{report.patient.name}</p>
          <p className="truncate text-sm text-muted">{report.patient.email}</p>
          <p className="mt-1 text-xs text-muted">Uploaded {formatDate(report.createdAt)}</p>
        </div>
        <StatusPill tone={status.tone} label={status.label} />
      </div>

      {summary && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-forest-soft px-2.5 py-1 text-forest">
            {summary.inRange} in range
          </span>
          {summary.outOfRange > 0 && (
            <span className="rounded-full bg-amber-soft px-2.5 py-1 text-amber">
              {summary.outOfRange} outside
            </span>
          )}
          {summary.critical > 0 && (
            <span className="rounded-full bg-critical-soft px-2.5 py-1 font-medium text-critical">
              {summary.critical} critical
            </span>
          )}
          {summary.notCovered > 0 && (
            <span className="rounded-full bg-line/60 px-2.5 py-1 text-muted">
              {summary.notCovered} not covered
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
