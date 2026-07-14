"use client";

import { useMemo, useState } from "react";
import type { Report } from "@/lib/model/types";
import { cn } from "@/lib/ui/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportCard } from "./report-card";

type Filter = "all" | "attention" | "in-progress" | "sent";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "attention", label: "Needs attention" },
  { key: "in-progress", label: "In progress" },
  { key: "sent", label: "Sent" },
];

function needsAttention(report: Report): boolean {
  if (report.status === "drafted" || report.status === "approved") return true;
  return (report.resultSummary?.critical ?? 0) > 0 && report.status !== "sent";
}

export function ReportsBrowser({ reports }: { reports: Report[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return reports;
    return reports.filter(
      (report) =>
        report.patient.name.toLowerCase().includes(q) ||
        report.patient.email.toLowerCase().includes(q),
    );
  }, [reports, query]);

  const visible = searched.filter((report) => {
    if (filter === "attention") return needsAttention(report);
    if (filter === "in-progress") return report.status !== "sent";
    if (filter === "sent") return report.status === "sent";
    return true;
  });

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
                "rounded-full px-3 py-1.5 text-sm transition-colors",
                filter === key
                  ? "bg-forest text-cream"
                  : "border border-line bg-paper text-muted hover:text-forest",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search patients"
          aria-label="Search patients"
          className="w-full rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 sm:w-64"
        />
      </div>

      <section className="mt-6">
        {visible.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No matching reports"
              description="Try a different search or filter, or upload a new report."
            />
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {visible.map((report) => (
              <li key={report.id}>
                <ReportCard report={report} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
