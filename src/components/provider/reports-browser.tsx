'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Report } from '@/lib/types';
import { reportStatusDisplay } from '@/lib/ui/report-status-display';
import { cn } from '@/lib/ui/cn';
import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState } from '@/components/ui/empty-state';

type Filter = 'all' | 'in-progress' | 'held' | 'sent';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'held', label: 'Held' },
  { key: 'sent', label: 'Sent' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function matchesFilter(report: Report, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'held') return report.status === 'held';
  if (filter === 'sent') return report.status === 'sent';
  return report.status !== 'held' && report.status !== 'sent';
}

export function ReportsBrowser({ reports }: { reports: Report[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((report) => {
      if (!matchesFilter(report, filter)) return false;
      if (q === '') return true;
      return (
        report.patient.name.toLowerCase().includes(q) ||
        report.patient.email.toLowerCase().includes(q)
      );
    });
  }, [reports, query, filter]);

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm transition-colors',
                filter === key
                  ? 'bg-forest text-cream'
                  : 'border border-line bg-paper text-muted hover:text-forest',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patients"
          aria-label="Search patients"
          className="w-full rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 sm:w-64"
        />
      </div>

      {visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No matching reports"
            description="Try a different search or filter, or start a new report."
          />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {visible.map((report) => {
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
