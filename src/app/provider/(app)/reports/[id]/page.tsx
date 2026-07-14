import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/db";
import { getAnalyte } from "@/lib/analytes";
import { extractReportAction, sendLinkAction } from "@/app/provider/actions";
import {
  PROVIDER_STEPS,
  reportStatusDisplay,
  stepIndexForStatus,
} from "@/lib/ui/report-status-display";
import { Stepper } from "@/components/ui/stepper";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { ReportFacsimile } from "@/components/provider/report-facsimile";
import { VerifyTable } from "@/components/provider/verify-table";
import { DraftEditor } from "@/components/provider/draft-editor";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getRepository();
  const report = await repo.getReport(id);
  if (report === null) notFound();

  const rows = await repo.getRows(id);
  const explanation = await repo.getExplanation(id);
  const shareLink = report.status === "sent" ? await repo.getShareLinkByReport(id) : null;
  const status = reportStatusDisplay(report.status);

  const draftEntries = (explanation?.perTest ?? []).map((entry) => ({
    analyteId: entry.analyteId,
    displayName: getAnalyte(entry.analyteId)?.displayName ?? entry.analyteId,
    text: entry.text,
  }));

  return (
    <div>
      <Link href="/provider" className="text-sm text-forest hover:underline">
        Back to reports
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">{report.patient.name}</h1>
          <p className="mt-1 text-sm text-muted">{report.patient.email}</p>
        </div>
        <StatusPill tone={status.tone} label={status.label} />
      </div>

      <div className="mt-6">
        <Stepper steps={PROVIDER_STEPS} current={stepIndexForStatus(report.status)} />
      </div>

      <div className="mt-10">
        {report.status === "uploaded" && (
          <section>
            <h2 className="font-display text-xl text-ink">Read the report</h2>
            <p className="mt-1 max-w-prose text-sm text-muted">
              The system will transcribe each test line from the report. You will verify every value
              against the report before anything is classified.
            </p>
            <form action={extractReportAction} className="mt-6">
              <input type="hidden" name="reportId" value={report.id} />
              <Button type="submit">Read the results</Button>
            </form>
          </section>
        )}

        {report.status === "extracted" && (
          <section>
            <h2 className="font-display text-xl text-ink">Verify the results</h2>
            <p className="mt-1 max-w-prose text-sm text-muted">
              Check each value against the report and correct anything that was misread. Nothing is
              classified until you confirm.
            </p>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ReportFacsimile rows={rows} patientName={report.patient.name} />
              <VerifyTable
                reportId={report.id}
                rows={rows.map((row) => ({
                  rawName: row.rawName,
                  value: row.value,
                  unit: row.unit ?? "",
                  refLow: row.refLow ?? "",
                  refHigh: row.refHigh ?? "",
                  rawRange: row.rawRange ?? "",
                  labFlags: row.labFlags,
                }))}
              />
            </div>
          </section>
        )}

        {(report.status === "verified" ||
          report.status === "drafted" ||
          report.status === "approved") &&
          explanation !== null && (
            <section>
              <h2 className="font-display text-xl text-ink">Review the explanation</h2>
              <p className="mt-1 max-w-prose text-sm text-muted">
                This is the plain-language explanation drafted from the classifications and
                MedlinePlus. Edit anything, then approve. Approved text is what the patient reads.
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
                <div className="mt-8 rounded-[var(--radius-card)] border border-forest/20 bg-forest-soft/40 p-5">
                  <h3 className="font-medium text-ink">Approved</h3>
                  <p className="mt-1 text-sm text-muted">
                    Send the patient their private, date-of-birth protected link.
                  </p>
                  <form action={sendLinkAction} className="mt-4">
                    <input type="hidden" name="reportId" value={report.id} />
                    <Button type="submit">Send to patient</Button>
                  </form>
                </div>
              )}
            </section>
          )}

        {report.status === "sent" && shareLink !== null && (
          <section className="rounded-[var(--radius-card)] border border-forest/20 bg-forest-soft/40 p-6">
            <h2 className="font-display text-xl text-ink">Sent to the patient</h2>
            <p className="mt-1 text-sm text-muted">
              The patient was notified. Their private link opens after they confirm their date of
              birth.
            </p>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Patient link</p>
              <Link
                href={`/r/${shareLink.token}`}
                className="mt-1 block break-all font-mono text-sm text-forest underline underline-offset-2"
              >
                /r/{shareLink.token}
              </Link>
            </div>
            <Link href={`/r/${shareLink.token}`} className="mt-6 inline-block">
              <Button variant="secondary">Open the patient view</Button>
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
