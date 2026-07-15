import { notFound } from 'next/navigation';
import { getExplanation, getReport, getRows, getShareLinkByToken } from '@/lib/data';
import { isDobConfirmed } from '@/lib/auth/dob-gate';
import { isExpired } from '@/lib/share-link';
import { buildResultsView } from '@/lib/ui/results-view';
import { CLINIC } from '@/lib/clinic';
import { DobGate } from '@/components/patient/dob-gate';
import { ResultsPage } from '@/components/patient/results-page';

function ExpiredNotice() {
  return (
    <div className="mx-auto max-w-md py-8 text-center">
      <h1 className="font-display text-2xl text-ink">This link has expired</h1>
      <p className="mt-2 text-sm text-muted">
        For your privacy, result links expire after a while. Call {CLINIC.name} at {CLINIC.phone}{' '}
        and they can send you a new one.
      </p>
    </div>
  );
}

export default async function PatientShare({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const link = await getShareLinkByToken(token);
  if (link === null) notFound();
  if (isExpired(link.expiresAt)) return <ExpiredNotice />;

  if (!(await isDobConfirmed(token))) {
    return <DobGate token={token} expiresAt={link.expiresAt} />;
  }

  const report = await getReport(link.reportId);
  const explanation = await getExplanation(link.reportId);
  // The approval gate: results render only for an approved report and explanation.
  if (
    report === null ||
    explanation === null ||
    !(report.status === 'approved' || report.status === 'sent') ||
    explanation.status !== 'approved'
  ) {
    notFound();
  }

  const rows = await getRows(link.reportId);
  const view = buildResultsView(rows, explanation);
  return <ResultsPage report={report} explanation={explanation} view={view} token={token} />;
}
