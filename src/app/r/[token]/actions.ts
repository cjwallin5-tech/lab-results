'use server';

import { redirect } from 'next/navigation';
import { timingSafeEqual } from 'node:crypto';
import { getReport, getShareLinkByToken } from '@/lib/data';
import { isDobConfirmed, setDobConfirmed } from '@/lib/auth/dob-gate';

export interface DobState {
  error?: string;
}

export interface AskState {
  error?: string;
  sent?: boolean;
}

function datesMatch(entered: string, stored: string): boolean {
  const a = Buffer.from(entered);
  const b = Buffer.from(stored);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function confirmDobAction(_prev: DobState, formData: FormData): Promise<DobState> {
  const token = String(formData.get('token') ?? '');
  const month = String(formData.get('month') ?? '').padStart(2, '0');
  const day = String(formData.get('day') ?? '').padStart(2, '0');
  const year = String(formData.get('year') ?? '').padStart(4, '0');
  const iso = `${year}-${month}-${day}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return { error: 'Enter your date of birth as month, day, and year.' };
  }

  const link = await getShareLinkByToken(token);
  const report = link ? await getReport(link.reportId) : null;
  if (link === null || report === null) {
    return { error: 'This link is no longer valid.' };
  }

  // Compared without logging the entered or stored date of birth.
  if (!datesMatch(iso, report.patient.dob)) {
    return { error: 'That date of birth did not match. Please check and try again.' };
  }

  await setDobConfirmed(token);
  redirect(`/r/${token}`);
}

export async function askQuestionAction(_prev: AskState, formData: FormData): Promise<AskState> {
  const token = String(formData.get('token') ?? '');
  if (!(await isDobConfirmed(token))) {
    redirect(`/r/${token}`);
  }
  const question = String(formData.get('question') ?? '').trim();
  if (question.length === 0) {
    return { error: 'Write your question first.' };
  }
  // Mock: no persistence yet. Swap to the Supabase question write when it lands.
  return { sent: true };
}
