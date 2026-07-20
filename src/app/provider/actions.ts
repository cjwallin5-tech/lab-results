'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  approveExplanation,
  createReport,
  createShareLink,
  getReport,
  reportHasCritical,
  resetReport,
  saveRows,
  setReportStatus,
} from '@/lib/data';
import { dobSchema, type ResultRow } from '@/lib/types';
import { ensureDraftExplanation } from '@/lib/data/templates';
import { extractRows } from '@/lib/extract';
import { matchAnalyte } from '@/lib/analytes';
import { classifyRow } from '@/lib/classify';
import type { EditableRow } from '@/components/provider/verify-table';
import {
  createProviderSession,
  destroyProviderSession,
  verifyProviderCredentials,
} from '@/lib/auth/session';

export interface FormState {
  error?: string;
}

function reportPath(reportId: string): string {
  return `/provider/reports/${reportId}`;
}

export async function uploadReportAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const dob = dobSchema.safeParse(String(formData.get('dob') ?? '').trim());
  if (name.length === 0 || !email.includes('@') || !dob.success) {
    return { error: 'Enter the patient name, a valid email, and a real date of birth.' };
  }
  // The PDF upload itself arrives with Supabase Storage; the report starts here.
  const report = await createReport({ name, email, dob: dob.data }, 'manual-entry');
  redirect(reportPath(report.id));
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  if (!verifyProviderCredentials(email, password)) {
    return { error: 'Those credentials did not match the demo provider account.' };
  }
  await createProviderSession();
  redirect('/provider');
}

export async function signOutAction(): Promise<void> {
  await destroyProviderSession();
  redirect('/provider/sign-in');
}

export async function extractReportAction(formData: FormData): Promise<void> {
  const reportId = String(formData.get('reportId') ?? '');
  const report = await getReport(reportId);
  if (report === null) return;

  // The provider may attach the report PDF on this step; its bytes feed the live
  // extractor in the same request (no persistence needed). With no file — or no
  // API key — extraction falls back to the offline synthetic path keyed by the
  // report's pdfRef, so the flow runs end to end without credentials.
  const file = formData.get('pdf');
  const pdfBytes =
    file instanceof File && file.size > 0 ? new Uint8Array(await file.arrayBuffer()) : undefined;

  const { rows } = await extractRows({ pdfRef: report.pdfRef, pdfBytes });

  // Transcription only (FR-03): store rows unmatched and unclassified. The
  // analyte match and classification are stamped after the provider verifies the
  // values against the report (FR-05/FR-06), in confirmVerificationAction.
  const stored: ResultRow[] = rows.map((row, index) => ({
    id: `${reportId}-${index}`,
    reportId,
    rawName: row.rawName,
    analyteId: undefined,
    value: row.value,
    unit: row.unit,
    refLow: toNumber(row.refLow ?? ''),
    refHigh: toNumber(row.refHigh ?? ''),
    rawRange: row.rawRange,
    labFlags: row.labFlags,
    lowConfidenceFields: row.lowConfidenceFields,
    classification: undefined,
  }));

  await saveRows(reportId, stored);
  await setReportStatus(reportId, 'extracted');
  revalidatePath(reportPath(reportId));
}

function toNumber(text: string): number | undefined {
  const value = Number(text.replace(/,/g, ''));
  return text.trim() === '' || !Number.isFinite(value) ? undefined : value;
}

export async function confirmVerificationAction(formData: FormData): Promise<void> {
  const reportId = String(formData.get('reportId') ?? '');

  let edited: EditableRow[] = [];
  try {
    edited = JSON.parse(String(formData.get('rows') ?? '[]')) as EditableRow[];
  } catch {
    edited = [];
  }

  // Persist the provider's corrections, stamped with the authoritative
  // classification (FR-06): the deterministic classifier runs on the verified
  // values, reading the curated dictionary for critical/plausibility thresholds.
  const rows: ResultRow[] = edited
    .filter((row) => row.rawName.trim() !== '')
    .map((row) => {
      // Normalization runs on the verified name: the provider just confirmed
      // rawName against the PDF, so it — not any stale client-sent analyteId —
      // decides the dictionary match. No match = honestly "not covered" (FR-04).
      const analyte = matchAnalyte(row.rawName);
      const refLow = toNumber(row.refLow);
      const refHigh = toNumber(row.refHigh);
      const unit = row.unit.trim() === '' ? undefined : row.unit;
      return {
        id: row.id,
        reportId,
        rawName: row.rawName,
        analyteId: analyte?.id,
        value: row.value,
        unit,
        refLow,
        refHigh,
        rawRange: row.rawRange.trim() === '' ? undefined : row.rawRange,
        labFlags: row.labFlags,
        lowConfidenceFields: [],
        classification: classifyRow({
          value: row.value,
          unit,
          refLow,
          refHigh,
          labFlags: row.labFlags,
          analyte,
        }),
      };
    });

  await saveRows(reportId, rows);
  await setReportStatus(reportId, 'verified');
  // Team model: a critical result holds the report; nothing is drafted or sent.
  if (await reportHasCritical(reportId)) {
    await setReportStatus(reportId, 'held');
  } else {
    ensureDraftExplanation(reportId);
    await setReportStatus(reportId, 'drafted');
  }
  revalidatePath(reportPath(reportId));
}

export async function resetReportAction(formData: FormData): Promise<void> {
  const reportId = String(formData.get('reportId') ?? '');
  await resetReport(reportId);
  revalidatePath(reportPath(reportId));
}

export async function approveDraftAction(formData: FormData): Promise<void> {
  const reportId = String(formData.get('reportId') ?? '');
  await approveExplanation(reportId);
  await setReportStatus(reportId, 'approved');
  revalidatePath(reportPath(reportId));
}

export async function sendLinkAction(formData: FormData): Promise<void> {
  const reportId = String(formData.get('reportId') ?? '');
  await createShareLink(reportId);
  await setReportStatus(reportId, 'sent');
  revalidatePath(reportPath(reportId));
}
