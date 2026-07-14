import { cn } from "@/lib/ui/cn";
import type { ResultItem } from "@/lib/ui/results-view";
import { CLINIC } from "@/lib/clinic";
import { RangeMarker } from "@/components/ui/range-marker";
import { StatusPill } from "@/components/ui/status-pill";

/**
 * One test on the patient results page. The safe states (critical, implausible,
 * not covered, could-not-be-read) render deliberately, never as a normal result.
 */
export function ResultCard({ item }: { item: ResultItem }) {
  const isCritical = item.classification.kind === "placed" && item.classification.critical;
  const canDrawMarker = item.display.showMarker && item.numericValue !== null;

  return (
    <article
      className={cn(
        "print-avoid-break rounded-[var(--radius-card)] border bg-paper p-5",
        isCritical ? "border-critical/40 ring-1 ring-critical/20" : "border-line",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-medium text-ink">{item.displayName}</h3>
        <div className="flex shrink-0 items-baseline gap-1">
          <span className="font-display text-2xl text-ink">{item.value}</span>
          {item.unit && <span className="text-xs text-muted">{item.unit}</span>}
        </div>
      </div>

      <div className="mt-2">
        <StatusPill tone={item.display.tone} label={item.display.label} />
      </div>

      {canDrawMarker && item.numericValue !== null && (
        <RangeMarker
          value={item.numericValue}
          low={item.low ?? undefined}
          high={item.high ?? undefined}
          tone={item.display.tone}
        />
      )}

      {isCritical && (
        <p className="mt-4 rounded-lg bg-critical-soft px-4 py-3 text-sm text-critical">
          Your care team is contacting you directly about this result. Please expect a call. If you
          have not heard from them, call {CLINIC.name} at {CLINIC.phone}.
        </p>
      )}

      {!isCritical && item.meaning && (
        <p className="mt-4 text-sm leading-relaxed text-ink/80">{item.meaning}</p>
      )}

      {item.classification.kind === "implausible" && (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          This value looks unusual and will be double-checked with your provider before it is read.
        </p>
      )}
      {item.classification.kind === "not-covered" && (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          We do not have a plain-language explanation for this test yet. Your provider can walk you
          through it.
        </p>
      )}
      {item.classification.kind === "unclassifiable" && (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          This line could not be read clearly from the report and will be rechecked.
        </p>
      )}

      {!isCritical && item.medlineplusUrl && (
        <a
          href={item.medlineplusUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm font-medium text-forest underline underline-offset-2"
        >
          Learn more at MedlinePlus
        </a>
      )}
    </article>
  );
}
