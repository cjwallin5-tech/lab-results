import Link from "next/link";
import { getRepository } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportsBrowser } from "@/components/provider/reports-browser";

export default async function ProviderDashboard() {
  const reports = await getRepository().listReports();

  const awaitingApproval = reports.filter(
    (report) => report.status === "drafted" || report.status === "approved",
  ).length;
  const critical = reports.filter(
    (report) => (report.resultSummary?.critical ?? 0) > 0 && report.status !== "sent",
  ).length;
  const sent = reports.filter((report) => report.status === "sent").length;

  const stats = [
    { label: "Awaiting you", value: awaitingApproval, tone: "text-forest" },
    { label: "With a critical result", value: critical, tone: "text-critical" },
    { label: "Sent to patients", value: sent, tone: "text-ink" },
    { label: "Total reports", value: reports.length, tone: "text-ink" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Reports</h1>
          <p className="mt-1 text-sm text-muted">
            Upload a lab report, verify what was read, and approve the explanation before it reaches
            the patient.
          </p>
        </div>
        <Link href="/provider/upload">
          <Button>Upload a report</Button>
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No reports yet"
            description="Upload a patient's lab report to start. Everything here runs on synthetic data."
            action={
              <Link href="/provider/upload">
                <Button>Upload a report</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[var(--radius-card)] border border-line bg-paper px-4 py-3">
                <dd className={`font-display text-2xl ${stat.tone}`}>{stat.value}</dd>
                <dt className="mt-0.5 text-xs text-muted">{stat.label}</dt>
              </div>
            ))}
          </dl>
          <ReportsBrowser reports={reports} />
        </>
      )}
    </div>
  );
}
