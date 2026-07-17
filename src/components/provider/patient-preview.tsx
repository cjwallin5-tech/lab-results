import type { Explanation, ResultRow } from "@/lib/model/types";
import { buildResultsView } from "@/lib/ui/results-view";
import { OverallPictureBox } from "@/components/patient/overall-picture-box";
import { ResultCard } from "@/components/patient/result-card";

/** Shows the provider exactly what the patient will see, from the current draft. */
export function PatientPreview({
  rows,
  explanation,
}: {
  rows: ResultRow[];
  explanation: Explanation;
}) {
  const view = buildResultsView(rows, explanation);

  return (
    <div className="mt-10 rounded-[var(--radius-card)] border border-line bg-cream/60 p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
        Patient preview
      </p>
      <div className="flex flex-col gap-5">
        <OverallPictureBox
          inRangeCount={view.inRangeCount}
          totalCount={view.totalCount}
          overallText={explanation.overallText}
          hasCritical={view.hasCritical}
          toneCounts={view.toneCounts}
        />
        {view.groups.map((group) => (
          <section key={group.panel}>
            <h3 className="mb-2 font-display text-lg text-ink">{group.panel}</h3>
            <div className="flex flex-col gap-3">
              {group.items.map((item) => (
                <ResultCard key={item.key} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
