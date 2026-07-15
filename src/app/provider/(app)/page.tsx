import Link from 'next/link';
import { listReports } from '@/lib/data';
import { reportStatusDisplay } from '@/lib/ui/report-status-display';
import { StatusPill } from '@/components/ui/status-pill';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function ProviderDashboard() {
  const reports = await listReports();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Reports</h1>
          <p className="mt-1 max-w-prose text-sm text-muted">
            Open a report to verify what was read and approve the explanation before it reaches the
            patient. A critical result is held for you to contact the patient directly.
          </p>
        </div>
        <Link href="/provider/upload">
          <Button>New report</Button>
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No reports yet"
            description="Start a report to walk the flow. Everything here runs on synthetic data."
            action={
              <Link href="/provider/upload">
                <Button>New report</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {reports.map((report) => {
            const status = reportStatusDisplay(report.status);
            return (
              <li key={report.id}>
                <Link
                  href={`/provider/reports/${report.id}`}
                  className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-line bg-paper px-5 py-4 transition-colors hover:border-forest/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{report.patient.name}</p>
                    <p className="truncate text-sm text-muted">{report.patient.email}</p>
                    <p className="mt-1 text-xs text-muted">
                      Uploaded {formatDate(report.createdAt)}
                    </p>
                  </div>
                  <StatusPill tone={status.tone} label={status.label} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
