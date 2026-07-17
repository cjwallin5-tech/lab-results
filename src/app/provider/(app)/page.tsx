import Link from 'next/link';
import { listReports } from '@/lib/data';
import type { ReportStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ReportsBrowser } from '@/components/provider/reports-browser';

const IN_PROGRESS_STATUSES: ReportStatus[] = ['uploaded', 'extracted', 'drafted', 'approved'];

export default async function ProviderDashboard() {
  const reports = await listReports();
  const counts = {
    total: reports.length,
    inProgress: reports.filter((report) => IN_PROGRESS_STATUSES.includes(report.status)).length,
    held: reports.filter((report) => report.status === 'held').length,
    sent: reports.filter((report) => report.status === 'sent').length,
  };

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
        <>
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="All reports" value={counts.total} />
            <StatTile label="In progress" value={counts.inProgress} />
            <StatTile label="Held" value={counts.held} tone="critical" />
            <StatTile label="Sent" value={counts.sent} tone="forest" />
          </dl>
          <ReportsBrowser reports={reports} />
        </>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'critical' | 'forest';
}) {
  const valueColor =
    tone === 'critical' ? 'text-critical' : tone === 'forest' ? 'text-forest' : 'text-ink';
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-paper px-5 py-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`mt-1 font-display text-3xl ${valueColor}`}>{value}</dd>
    </div>
  );
}
