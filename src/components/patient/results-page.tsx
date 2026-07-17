import type { Explanation, Report } from "@/lib/model/types";
import type { ResultsView } from "@/lib/ui/results-view";
import { panelDescription } from "@/lib/ui/panel-meta";
import { CLINIC } from "@/lib/clinic";
import { OverallPictureBox } from "./overall-picture-box";
import { ResultCard } from "./result-card";
import { CriticalAlert } from "./critical-alert";
import { AtAGlance } from "./at-a-glance";
import { Glossary } from "./glossary";
import { PrintButton } from "./print-button";
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
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
            {firstName}, here are your results, explained simply.
          </h1>
          <p className="mt-2 text-sm text-muted">
            Blood work collected {collected} at {CLINIC.name}.
          </p>
        </div>
        <PrintButton />
      </header>

      {view.hasCritical && <CriticalAlert clinicName={CLINIC.name} phone={CLINIC.phone} />}

      <OverallPictureBox
        inRangeCount={view.inRangeCount}
        totalCount={view.totalCount}
        overallText={explanation.overallText}
        hasCritical={view.hasCritical}
      />

      <AtAGlance counts={view.toneCounts} />

      {view.groups.map((group) => (
        <section key={group.panel}>
          <h2 className="mb-3 flex flex-wrap items-baseline gap-x-2 font-display text-2xl text-ink">
            {group.panel}
            {panelDescription(group.panel) && (
              <span className="text-sm font-normal text-muted">
                {panelDescription(group.panel)}
              </span>
            )}
          </h2>
          <div className="flex flex-col gap-4">
            {group.items.map((item) => (
              <ResultCard key={item.key} item={item} />
            ))}
          </div>
        </section>
      ))}

      <Glossary
        classifications={view.groups.flatMap((group) =>
          group.items.map((item) => item.classification),
        )}
      />

      {explanation.sources.length > 0 && (
        <section className="border-t border-line pt-6 text-center">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Sources</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {explanation.sources.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm text-forest underline underline-offset-2"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="no-print">
        <CtaBand
          title="Questions about these results?"
          subtitle={`${CLINIC.providerName} usually replies within one business day.`}
          actionLabel={`Message ${CLINIC.providerName}`}
          actionHref={`/r/${token}/ask`}
        />
      </div>
    </div>
  );
}
