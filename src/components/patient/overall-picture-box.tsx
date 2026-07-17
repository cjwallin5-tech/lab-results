import { StatusPill } from '@/components/ui/status-pill';

/** The summary box at the top of the results page: a count plus the overall text. */
export function OverallPictureBox({
  inRangeCount,
  totalCount,
  overallText,
}: {
  inRangeCount: number;
  totalCount: number;
  overallText: string;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-forest/20 bg-forest-soft/50 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full bg-paper text-center">
          <span className="font-display text-lg leading-none text-forest">
            {inRangeCount}/{totalCount}
          </span>
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
            in range
          </span>
        </div>
        <div>
          <h2 className="font-display text-xl text-ink">The overall picture</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">{overallText}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <StatusPill tone="in" label="In typical range" />
            <StatusPill tone="high" label="A little outside" />
          </div>
        </div>
      </div>
    </section>
  );
}
