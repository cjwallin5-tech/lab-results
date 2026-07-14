import type { Explanation, Report } from "@/lib/model/types";
import type { ResultsView } from "@/lib/ui/results-view";
import { CLINIC } from "@/lib/clinic";
import { OverallPictureBox } from "./overall-picture-box";
import { ResultCard } from "./result-card";
import { CtaBand } from "@/components/ui/cta-band";

export function ResultsPage({
  report,
  explanation,
  view,
  token,
}: {
  report: Report;
  explanation: Explanation;
  view: ResultsView;
  token: string;
}) {
  const firstName = report.patient.name.split(" ")[0];
  const collected = new Date(report.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-4xl leading-tight text-ink">
          {firstName}, here are your results, explained simply.
        </h1>
        <p className="mt-2 text-sm text-muted">
          Blood work collected {collected} at {CLINIC.name}.
        </p>
      </header>

      <OverallPictureBox
        inRangeCount={view.inRangeCount}
        totalCount={view.totalCount}
        overallText={explanation.overallText}
        hasCritical={view.hasCritical}
      />

      {view.groups.map((group) => (
        <section key={group.panel}>
          <h2 className="mb-3 font-display text-2xl text-ink">{group.panel}</h2>
          <div className="flex flex-col gap-4">
            {group.items.map((item) => (
              <ResultCard key={item.key} item={item} />
            ))}
          </div>
        </section>
      ))}

      {explanation.sources.length > 0 && (
        <section className="border-t border-line pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Sources</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {explanation.sources.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-forest underline underline-offset-2"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CtaBand
        title="Questions about these results?"
        subtitle={`${CLINIC.providerName} usually replies within one business day.`}
        actionLabel={`Message ${CLINIC.providerName}`}
        actionHref={`/r/${token}/ask`}
      />
    </div>
  );
}
