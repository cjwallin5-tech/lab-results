"use server";

import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { getRepository } from "@/lib/db";
import { dobEntrySchema, dobEntryToIso } from "@/lib/model/schema";
import { isDobConfirmed, setDobConfirmed } from "@/lib/auth/dob-gate";
import { sendQuestion } from "@/lib/email";

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
  const token = String(formData.get("token") ?? "");
  const parsed = dobEntrySchema.safeParse({
    month: formData.get("month"),
    day: formData.get("day"),
    year: formData.get("year"),
  });
  if (!parsed.success) {
    return { error: "Enter your date of birth as month, day, and year." };
  }

  const repo = getRepository();
  const link = await repo.getShareLinkByToken(token);
  const report = link ? await repo.getReport(link.reportId) : null;
  if (link === null || report === null) {
    return { error: "This link is no longer valid." };
  }

  // Compared without logging the entered or stored date of birth.
  if (!datesMatch(dobEntryToIso(parsed.data), report.patient.dob)) {
    return { error: "That date of birth did not match. Please check and try again." };
  }

  await repo.markLinkOpened(token);
  await setDobConfirmed(token);
  redirect(`/r/${token}`);
}

export async function askQuestionAction(_prev: AskState, formData: FormData): Promise<AskState> {
  const token = String(formData.get("token") ?? "");
  if (!(await isDobConfirmed(token))) {
    redirect(`/r/${token}`);
  }
  const question = String(formData.get("question") ?? "").trim();
  if (question.length === 0) {
    return { error: "Write your question first." };
  }
  await sendQuestion();
  return { sent: true };
}
