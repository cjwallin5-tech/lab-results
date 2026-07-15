'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  approveExplanation,
  createReport,
  createShareLink,
  reportHasCritical,
  setReportStatus,
} from '@/lib/data';
import { dobSchema } from '@/lib/types';
import { ensureDraftExplanation, ensureExtractedRows } from '@/lib/data/templates';
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

export async function confirmVerificationAction(formData: FormData): Promise<void> {
  const reportId = String(formData.get('reportId') ?? '');
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
