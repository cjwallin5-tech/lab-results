import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/db";
import { getAnalyte, loadDictionary } from "@/lib/analytes";
import { classificationDisplay } from "@/lib/ui/classification-display";
import { extractReportAction, resetReportAction, sendLinkAction } from "@/app/provider/actions";
import { outstandingOutreach } from "@/lib/report/critical";
import {
  PROVIDER_STEPS,
  reportStatusDisplay,
  stepIndexForStatus,
} from "@/lib/ui/report-status-display";
import { Stepper } from "@/components/ui/stepper";
import { StatusPill } from "@/components/ui/status-pill";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ReportFacsimile } from "@/components/provider/report-facsimile";
import { VerifyTable } from "@/components/provider/verify-table";
import { DraftEditor, type DraftEntry } from "@/components/provider/draft-editor";
import { PatientPreview } from "@/components/provider/patient-preview";
import { StatusTimeline } from "@/components/provider/status-timeline";
import { ProviderNotes } from "@/components/provider/provider-notes";
import { ShareLinkPanel } from "@/components/provider/share-link-panel";
import { OutreachPanel, type CriticalItem } from "@/components/provider/outreach-panel";

function formatDob(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getRepository();
  const report = await repo.getReport(id);
  if (report === null) notFound();

  const rows = await repo.getRows(id);
  const explanation = await repo.getExplanation(id);
  const shareLink = report.status === "sent" ? await repo.getShareLinkByReport(id) : null;
  const status = reportStatusDisplay(report.status);
  const showExplanation =
    (report.status === "verified" || report.status === "drafted" || report.status === "approved") &&
    explanation !== null;

  const rowByAnalyte = new Map(
    rows.filter((row) => row.analyteId !== undefined).map((row) => [row.analyteId, row]),
  );
  const outreachByAnalyte = new Map(report.outreach.map((entry) => [entry.analyteId, entry]));
  const criticalItems: CriticalItem[] = rows
    .filter(
      (row) =>
        row.analyteId !== undefined &&
        row.classification?.kind === "placed" &&
        row.classification.critical,
    )
    .map((row) => ({
      analyteId: row.analyteId as string,
      displayName: getAnalyte(row.analyteId as string)?.displayName ?? row.rawName,
      value: row.value,
      unit: row.unit,
      contacted: outreachByAnalyte.get(row.analyteId as string),
    }));
  const outstanding = outstandingOutreach(report, rows);

  const draftEntries: DraftEntry[] = (explanation?.perTest ?? []).map((entry) => {
    const row = rowByAnalyte.get(entry.analyteId);
    const display = classificationDisplay(row?.classification ?? { kind: "unclassifiable" });
    return {
      analyteId: entry.analyteId,
      displayName: getAnalyte(entry.analyteId)?.displayName ?? entry.analyteId,
      text: entry.text,
      value: row?.value ?? "",
      unit: row?.unit,
      tone: display.tone,
      statusLabel: display.label,
    };
  });

  return (
    <div>
      <Link href="/provider" className="text-sm text-forest hover:underline">
        Back to reports
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">{report.patient.name}</h1>
          <p className="mt-1 text-sm text-muted">{report.patient.email}</p>
        </div>
        <StatusPill tone={status.tone} label={status.label} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Stepper steps={PROVIDER_STEPS} current={stepIndexForStatus(report.status)} />
        {report.status !== "uploaded" && (
          <form action={resetReportAction}>
            <input type="hidden" name="reportId" value={report.id} />
            <ConfirmButton
              message="Start this report over? This clears its progress and any sent link."
              className="text-sm text-muted transition-colors hover:text-forest"
            >
              Start over
            </ConfirmButton>
          </form>
        )}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          {report.status === "uploaded" && (
            <section>
              <h2 className="font-display text-xl text-ink">Read the report</h2>
              <p className="mt-1 max-w-prose text-sm text-muted">
                The system will transcribe each test line. You will verify every value against the
                report before anything is classified.
              </p>
              <form action={extractReportAction} className="mt-6">
                <input type="hidden" name="reportId" value={report.id} />
                <SubmitButton pendingLabel="Reading...">Read the results</SubmitButton>
              </form>
            </section>
          )}

          {report.status === "extracted" && (
            <section>
              <h2 className="font-display text-xl text-ink">Verify the results</h2>
              <p className="mt-1 max-w-prose text-sm text-muted">
                Check each value against the report and correct anything that was misread. The
                preview shows how each result will classify. Nothing is saved until you confirm.
              </p>
              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <ReportFacsimile rows={rows} patientName={report.patient.name} />
                <VerifyTable
                  reportId={report.id}
                  dictionary={loadDictionary()}
                  rows={rows.map((row) => ({
                    rawName: row.rawName,
                    value: row.value,
                    unit: row.unit ?? "",
                    refLow: row.refLow ?? "",
                    refHigh: row.refHigh ?? "",
                    rawRange: row.rawRange ?? "",
                    labFlags: row.labFlags,
                    lowConfidenceFields: row.lowConfidenceFields,
                  }))}
                />
              </div>
            </section>
          )}

          {showExplanation && explanation !== null && (
            <section>
              <h2 className="font-display text-xl text-ink">Review the explanation</h2>
              <p className="mt-1 max-w-prose text-sm text-muted">
                Drafted from the classifications and MedlinePlus. Edit anything, then approve.
                Approved text is what the patient reads.
              </p>
              <div className="mt-6">
                <DraftEditor
                  reportId={report.id}
                  overallText={explanation.overallText}
                  entries={draftEntries}
                  approved={explanation.status === "approved"}
                />
              </div>

              {report.status === "approved" && (
                <div className="mt-8 flex flex-col gap-6">
                  {criticalItems.length > 0 && (
                    <OutreachPanel reportId={report.id} items={criticalItems} />
                  )}
                  <div className="rounded-[var(--radius-card)] border border-forest/20 bg-forest-soft/40 p-5">
                    <h3 className="font-medium text-ink">Send to the patient</h3>
                    {outstanding.length > 0 ? (
                      <p className="mt-1 text-sm text-muted">
                        Log a direct contact for each critical result above before you can send the
                        self-serve link.
                      </p>
                    ) : (
                      <>
                        <p className="mt-1 text-sm text-muted">
                          Send the patient their private, date-of-birth protected link.
                        </p>
                        <form action={sendLinkAction} className="mt-4">
                          <input type="hidden" name="reportId" value={report.id} />
                          <SubmitButton pendingLabel="Sending...">Send to patient</SubmitButton>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              )}

              <PatientPreview rows={rows} explanation={explanation} />
            </section>
          )}

          {report.status === "sent" && shareLink !== null && explanation !== null && (
            <section>
              <h2 className="font-display text-xl text-ink">Sent to the patient</h2>
              <p className="mt-1 text-sm text-muted">
                The patient was notified. Their link opens after they confirm their date of birth.
              </p>
              <Link
                href={`/r/${shareLink.token}`}
                className="mt-4 inline-flex items-center rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-forest ring-1 ring-line transition-colors hover:bg-forest-soft"
              >
                Open the patient view
              </Link>
              <PatientPreview rows={rows} explanation={explanation} />
            </section>
          )}
          {report.questions.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-xl text-ink">Patient questions</h2>
              <ul className="mt-3 flex flex-col gap-3">
                {report.questions.map((question, index) => (
                  <li key={index} className="rounded-[var(--radius-card)] border border-line bg-paper p-4">
                    <p className="text-sm text-ink">{question.text}</p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(question.at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <div className="rounded-[var(--radius-card)] border border-line bg-paper p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Patient</h3>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div>
                <dt className="text-muted">Name</dt>
                <dd className="text-ink">{report.patient.name}</dd>
              </div>
              <div>
                <dt className="text-muted">Date of birth</dt>
                <dd className="text-ink">{formatDob(report.patient.dob)}</dd>
              </div>
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="break-all text-ink">{report.patient.email}</dd>
              </div>
            </dl>
          </div>

          {shareLink !== null && (
            <div className="rounded-[var(--radius-card)] border border-line bg-paper p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Patient link
              </h3>
              <div className="mt-3">
                <ShareLinkPanel
                  reportId={report.id}
                  path={`/r/${shareLink.token}`}
                  expiresAt={shareLink.expiresAt}
                  openedAt={shareLink.openedAt}
                />
              </div>
            </div>
          )}

          <div className="rounded-[var(--radius-card)] border border-line bg-paper p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Timeline</h3>
            <div className="mt-3">
              <StatusTimeline history={report.statusHistory} />
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] border border-line bg-paper p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Notes</h3>
            <div className="mt-3">
              <ProviderNotes reportId={report.id} note={report.providerNote ?? ""} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
