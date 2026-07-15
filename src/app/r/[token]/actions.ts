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

function lastNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/).pop()?.toLowerCase() ?? "";
}

export async function confirmDobAction(_prev: DobState, formData: FormData): Promise<DobState> {
  const token = String(formData.get("token") ?? "");
  const lastName = String(formData.get("lastName") ?? "")
    .trim()
    .toLowerCase();
  const parsed = dobEntrySchema.safeParse({
    month: formData.get("month"),
    day: formData.get("day"),
    year: formData.get("year"),
  });
  if (lastName.length === 0 || !parsed.success) {
    return { error: "Enter your last name and date of birth." };
  }

  const repo = getRepository();
  const link = await repo.getShareLinkByToken(token);
  const report = link ? await repo.getReport(link.reportId) : null;
  if (link === null || report === null) {
    return { error: "This link is no longer valid." };
  }

  // Both factors checked; a single generic error avoids revealing which was wrong.
  // The entered and stored last name and date of birth are never logged.
  const dobOk = datesMatch(dobEntryToIso(parsed.data), report.patient.dob);
  const lastNameOk = lastName === lastNameOf(report.patient.name);
  if (!dobOk || !lastNameOk) {
    return {
      error: "That information did not match. Please check your last name and date of birth.",
    };
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
  const repo = getRepository();
  const link = await repo.getShareLinkByToken(token);
  if (link !== null) {
    await repo.addQuestion(link.reportId, { text: question, at: new Date().toISOString() });
  }
  await sendQuestion();
  return { sent: true };
}
