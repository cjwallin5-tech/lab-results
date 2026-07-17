import type { ToneCounts } from "@/lib/ui/results-view";
import { StatusPill } from "@/components/ui/status-pill";

/** One segment of the at-a-glance bar: a share of the total, in a tone color. */
const SEGMENTS: { key: keyof ToneCounts; className: string }[] = [
  { key: "inRange", className: "bg-forest" },
  { key: "outside", className: "bg-amber" },
  { key: "critical", className: "bg-critical" },
  { key: "other", className: "bg-line" },
];

/** The summary box at the top of the results page: a count plus the overall text. */
export function OverallPictureBox({
  inRangeCount,
  totalCount,
  overallText,
  hasCritical,
  toneCounts,
}: {
  inRangeCount: number;
  totalCount: number;
  overallText: string;
  hasCritical: boolean;
  toneCounts: ToneCounts;
}) {
  const allInRange =
    toneCounts.outside === 0 && toneCounts.other === 0 && toneCounts.critical === 0;

  return (
    <section
      className={
        hasCritical
          ? "rounded-[var(--radius-card)] border border-critical/40 bg-critical-soft/40 p-6"
          : "rounded-[var(--radius-card)] border border-forest/20 bg-forest-soft/50 p-6"
      }
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full bg-paper text-center">
          <span className="font-display text-lg leading-none text-forest">
            {inRangeCount}/{totalCount}
          </span>
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
            in range
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl text-ink">The overall picture</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">{overallText}</p>

          {totalCount > 0 && (
            <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-line" aria-hidden>
              {SEGMENTS.map(({ key, className }) =>
                toneCounts[key] > 0 ? (
                  <div
                    key={key}
                    className={className}
                    style={{ width: `${(toneCounts[key] / totalCount) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {allInRange ? (
              <StatusPill tone="in" label="Every result in the typical range" />
            ) : (
              <>
                <StatusPill tone="in" label="In typical range" />
                <StatusPill tone="high" label="A little outside" />
                {hasCritical && <StatusPill tone="critical" label="Needs prompt attention" />}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
