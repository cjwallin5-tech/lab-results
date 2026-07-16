'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  approveExplanation,
  createReport,
  createShareLink,
  reportHasCritical,
  saveRows,
  setReportStatus,
} from '@/lib/data';
import { dobSchema, type ResultRow } from '@/lib/types';
import { ensureDraftExplanation, ensureExtractedRows } from '@/lib/data/templates';
import { previewClassification } from '@/lib/ui/preview-classification';
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
  ensureExtractedRows(reportId);
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

  // Persist the provider's corrections. The preview classification is a
  // placeholder; the pipeline's deterministic classifier stamps the real one.
  const rows: ResultRow[] = edited
    .filter((row) => row.rawName.trim() !== '')
    .map((row) => {
      const analyteId = row.analyteId && row.analyteId.trim() !== '' ? row.analyteId : undefined;
      const refLow = toNumber(row.refLow);
      const refHigh = toNumber(row.refHigh);
      return {
        id: row.id,
        reportId,
        rawName: row.rawName,
        analyteId,
        value: row.value,
        unit: row.unit.trim() === '' ? undefined : row.unit,
        refLow,
        refHigh,
        rawRange: row.rawRange.trim() === '' ? undefined : row.rawRange,
        labFlags: row.labFlags,
        lowConfidenceFields: [],
        classification: previewClassification({ analyteId, value: row.value, refLow, refHigh }),
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
