import Link from "next/link";
import { getRepository } from "@/lib/db";
import { reportStatusDisplay } from "@/lib/ui/report-status-display";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";

export default async function ProviderDashboard() {
  const reports = await getRepository().listReports();

  return (
    <div>
      <div className="flex items-end justify-between">
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

      <ul className="mt-8 flex flex-col gap-3">
        {reports.map((report) => {
          const status = reportStatusDisplay(report.status);
          return (
            <li key={report.id}>
              <Link
                href={`/provider/reports/${report.id}`}
                className="flex items-center justify-between rounded-[var(--radius-card)] border border-line bg-paper px-5 py-4 transition-colors hover:border-forest/40"
              >
                <div>
                  <p className="font-medium text-ink">{report.patient.name}</p>
                  <p className="text-sm text-muted">{report.patient.email}</p>
                </div>
                <StatusPill tone={status.tone} label={status.label} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
