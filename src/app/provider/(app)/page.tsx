import Link from "next/link";
import { getRepository } from "@/lib/db";
import { buildActivity, buildWorklist, hasOutreachPending } from "@/lib/ui/activity";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { ReportsBrowser } from "@/components/provider/reports-browser";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ProviderDashboard() {
  const repo = getRepository();
  const reports = await repo.listReports();
  const links = await repo.listShareLinks();

  const worklist = buildWorklist(reports);
  const activity = buildActivity(reports, links);

  const stats = [
    {
      label: "Awaiting you",
      value: reports.filter((r) => r.status === "drafted" || r.status === "approved").length,
      tone: "text-forest",
    },
    {
      label: "Outreach pending",
      value: reports.filter(hasOutreachPending).length,
      tone: "text-critical",
    },
    {
      label: "Questions",
      value: reports.reduce((total, r) => total + r.questions.length, 0),
      tone: "text-ink",
    },
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

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-[var(--radius-card)] border border-line bg-paper p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Your to-do
              </h2>
              {worklist.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Nothing needs your attention right now.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {worklist.map((item, index) => (
                    <li key={`${item.reportId}-${index}`}>
                      <Link
                        href={`/provider/reports/${item.reportId}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 transition-colors hover:border-forest/40"
                      >
                        <span className="text-sm font-medium text-ink">{item.patientName}</span>
                        <StatusPill tone={item.tone} label={item.label} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[var(--radius-card)] border border-line bg-paper p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Recent activity
              </h2>
              {activity.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No recent activity.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2.5">
                  {activity.map((event, index) => (
                    <li key={index} className="text-sm">
                      <Link href={`/provider/reports/${event.reportId}`} className="hover:underline">
                        <span className="text-ink">{event.label}</span>{" "}
                        <span className="text-muted">
                          for {event.patientName} · {formatTime(event.at)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <ReportsBrowser reports={reports} />
        </>
      )}
    </div>
  );
}
