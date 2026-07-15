import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getExplanation, getReport, getRows, getShareLinkByReport } from '@/lib/data';
import { analyteDisplayName } from '@/lib/data/dictionary';
import { classificationDisplay } from '@/lib/ui/classification-display';
import {
  PROVIDER_STEPS,
  reportStatusDisplay,
  stepIndexForStatus,
} from '@/lib/ui/report-status-display';
import {
  approveDraftAction,
  confirmVerificationAction,
  extractReportAction,
  sendLinkAction,
} from '@/app/provider/actions';
import { CLINIC } from '@/lib/clinic';
import { Stepper } from '@/components/ui/stepper';
import { StatusPill } from '@/components/ui/status-pill';
import { SubmitButton } from '@/components/ui/submit-button';

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);
  if (report === null) notFound();

  const rows = await getRows(id);
  const explanation = await getExplanation(id);
  const shareLink = report.status === 'sent' ? await getShareLinkByReport(id) : null;
  const status = reportStatusDisplay(report.status);
  const criticalRows = rows.filter(
    (row) => row.classification?.kind === 'range' && row.classification.critical,
  );

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

      <div className="mt-6">
        <Stepper steps={PROVIDER_STEPS} current={stepIndexForStatus(report.status)} />
      </div>

      <div className="mt-10">
        {report.status === 'uploaded' && (
          <section>
            <h2 className="font-display text-xl text-ink">Read the report</h2>
            <p className="mt-1 max-w-prose text-sm text-muted">
              The system transcribes each test line. You verify every value before anything is
              classified.
            </p>
            <form action={extractReportAction} className="mt-6">
              <input type="hidden" name="reportId" value={report.id} />
              <SubmitButton pendingLabel="Reading...">Read the results</SubmitButton>
            </form>
          </section>
        )}

        {report.status === 'extracted' && (
          <section>
            <h2 className="font-display text-xl text-ink">Verify the results</h2>
            <p className="mt-1 max-w-prose text-sm text-muted">
              Check each value against the report. The preview shows how each result classifies. A
              critical result will hold the report for a direct call.
            </p>
            <div className="mt-6 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-paper">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Test</th>
                    <th className="px-4 py-3 font-medium">Value</th>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Will show as</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const display = classificationDisplay(
                      row.classification ?? { kind: 'unclassifiable', reason: 'no-range' },
                    );
                    return (
                      <tr key={row.id} className="border-b border-line/60 last:border-0">
                        <td className="px-4 py-3 text-ink">
                          {analyteDisplayName(row.analyteId, row.rawName)}
                        </td>
                        <td className="px-4 py-3 text-ink">
                          {row.value} {row.unit}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {[row.refLow, row.refHigh].filter((n) => n !== undefined).join(' to ') ||
                            '-'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill tone={display.tone} label={display.label} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <form action={confirmVerificationAction} className="mt-6">
              <input type="hidden" name="reportId" value={report.id} />
              <SubmitButton pendingLabel="Confirming...">Confirm results</SubmitButton>
            </form>
          </section>
        )}

        {report.status === 'held' && (
          <section className="rounded-[var(--radius-card)] border border-critical/40 bg-critical-soft/40 p-6">
            <h2 className="font-display text-xl text-critical">
              Held: contact the patient directly
            </h2>
            <p className="mt-1 max-w-prose text-sm text-ink/80">
              This report has a critical result. Nothing is drafted or sent to the patient. Reach
              the patient directly about the result below, then follow your clinic&apos;s process.
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {criticalRows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3"
                >
                  <span className="font-medium text-ink">
                    {analyteDisplayName(row.analyteId, row.rawName)}{' '}
                    <span className="font-normal text-muted">
                      {row.value} {row.unit}
                    </span>
                  </span>
                  <StatusPill tone="critical" label="Needs prompt attention" />
                </li>
              ))}
            </ul>
          </section>
        )}

        {(report.status === 'drafted' || report.status === 'approved') && explanation !== null && (
          <section>
            <h2 className="font-display text-xl text-ink">Review the explanation</h2>
            <p className="mt-1 max-w-prose text-sm text-muted">
              Drafted from the classifications and MedlinePlus. Approve to make it what the patient
              reads.
            </p>
            <div className="mt-6 rounded-[var(--radius-card)] border border-line bg-paper p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Overall picture
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink/90">{explanation.overallText}</p>
              <div className="mt-4 flex flex-col gap-3">
                {explanation.perTest.map((entry) => (
                  <div key={entry.analyteId}>
                    <p className="text-sm font-medium text-ink">
                      {analyteDisplayName(entry.analyteId, entry.analyteId)}
                    </p>
                    <p className="text-sm text-muted">{entry.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {report.status === 'drafted' && (
              <form action={approveDraftAction} className="mt-6">
                <input type="hidden" name="reportId" value={report.id} />
                <SubmitButton pendingLabel="Approving...">Approve for the patient</SubmitButton>
              </form>
            )}

            {report.status === 'approved' && (
              <div className="mt-6 rounded-[var(--radius-card)] border border-forest/20 bg-forest-soft/40 p-5">
                <h3 className="font-medium text-ink">Approved</h3>
                <p className="mt-1 text-sm text-muted">
                  Send the patient their private, date-of-birth protected link.
                </p>
                <form action={sendLinkAction} className="mt-4">
                  <input type="hidden" name="reportId" value={report.id} />
                  <SubmitButton pendingLabel="Sending...">Send to patient</SubmitButton>
                </form>
              </div>
            )}
          </section>
        )}

        {report.status === 'sent' && shareLink !== null && (
          <section className="rounded-[var(--radius-card)] border border-forest/20 bg-forest-soft/40 p-6">
            <h2 className="font-display text-xl text-ink">Sent to the patient</h2>
            <p className="mt-1 text-sm text-muted">
              The patient link opens after they confirm their date of birth ({CLINIC.providerName}
              &apos;s patients enter their DOB).
            </p>
            <Link
              href={`/r/${shareLink.token}`}
              className="mt-4 inline-block break-all font-mono text-sm text-forest underline underline-offset-2"
            >
              /r/{shareLink.token}
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
