"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepository } from "@/lib/db";
import {
  createProviderSession,
  destroyProviderSession,
  verifyProviderCredentials,
} from "@/lib/auth/session";
import { uploadMetadataSchema } from "@/lib/model/schema";
import { classifyRows, extractRows } from "@/lib/report/pipeline";
import { buildDraft } from "@/lib/draft";
import { availablePdfRefs } from "@/lib/llm/offline";
import { sendShareLink } from "@/lib/email";
import type { ResultRow } from "@/lib/model/types";

export interface FormState {
  error?: string;
}

function reportPath(reportId: string): string {
  return `/provider/reports/${reportId}`;
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!verifyProviderCredentials(email, password)) {
    return { error: "Those credentials did not match the demo provider account." };
  }
  await createProviderSession();
  redirect("/provider");
}

export async function signOutAction(): Promise<void> {
  await destroyProviderSession();
  redirect("/provider/sign-in");
}

export async function uploadReportAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = uploadMetadataSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    dob: String(formData.get("dob") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the patient details." };
  }
  const pdfRef = String(formData.get("pdfRef") ?? "");
  if (!availablePdfRefs().includes(pdfRef)) {
    return { error: "Choose a synthetic report to upload." };
  }
  const report = await getRepository().createReport({ patient: parsed.data, pdfRef });
  redirect(reportPath(report.id));
}

export async function extractReportAction(formData: FormData): Promise<void> {
  const reportId = String(formData.get("reportId") ?? "");
  const repo = getRepository();
  const report = await repo.getReport(reportId);
  if (report === null) redirect("/provider");
  const rows = await extractRows(report);
  await repo.saveRows(reportId, rows);
  await repo.setReportStatus(reportId, "extracted");
  revalidatePath(reportPath(reportId));
}

const editedRowSchema = z.object({
  rawName: z.string().min(1),
  value: z.string(),
  unit: z.string().optional(),
  refLow: z.string().optional(),
  refHigh: z.string().optional(),
  rawRange: z.string().optional(),
  labFlags: z.array(z.string()).optional(),
});

function blankToUndefined(value: string | undefined): string | undefined {
  return value === undefined || value.trim() === "" ? undefined : value;
}

export async function confirmVerificationAction(formData: FormData): Promise<void> {
  const reportId = String(formData.get("reportId") ?? "");
  const edited = z
    .array(editedRowSchema)
    .parse(JSON.parse(String(formData.get("rows") ?? "[]")));

  const rows: ResultRow[] = edited.map((row) => ({
    reportId,
    rawName: row.rawName,
    value: row.value,
    unit: blankToUndefined(row.unit),
    refLow: blankToUndefined(row.refLow),
    refHigh: blankToUndefined(row.refHigh),
    rawRange: blankToUndefined(row.rawRange),
    labFlags: row.labFlags ?? [],
    lowConfidenceFields: [],
  }));

  const classified = classifyRows(rows);
  const repo = getRepository();
  await repo.saveRows(reportId, classified);
  await repo.setReportStatus(reportId, "verified");

  const report = await repo.getReport(reportId);
  if (report !== null) {
    const draftExplanation = await buildDraft(report, classified);
    await repo.saveExplanation(draftExplanation);
    await repo.setReportStatus(reportId, "drafted");
  }
  revalidatePath(reportPath(reportId));
}

export async function saveDraftAction(formData: FormData): Promise<void> {
  const reportId = String(formData.get("reportId") ?? "");
  const repo = getRepository();
  const explanation = await repo.getExplanation(reportId);
  if (explanation === null) redirect(reportPath(reportId));
  await repo.saveExplanation({
    ...explanation,
    overallText: String(formData.get("overallText") ?? explanation.overallText),
    perTest: explanation.perTest.map((entry) => ({
      analyteId: entry.analyteId,
      text: String(formData.get(`text-${entry.analyteId}`) ?? entry.text),
    })),
    status: "draft",
    approvedAt: null,
  });
  revalidatePath(reportPath(reportId));
}

export async function approveDraftAction(formData: FormData): Promise<void> {
  const reportId = String(formData.get("reportId") ?? "");
  const repo = getRepository();
  const explanation = await repo.getExplanation(reportId);
  if (explanation === null) redirect(reportPath(reportId));
  // Persist any final edits from the review form, then freeze as approved.
  await repo.saveExplanation({
    ...explanation,
    overallText: String(formData.get("overallText") ?? explanation.overallText),
    perTest: explanation.perTest.map((entry) => ({
      analyteId: entry.analyteId,
      text: String(formData.get(`text-${entry.analyteId}`) ?? entry.text),
    })),
    status: "approved",
    approvedAt: new Date().toISOString(),
  });
  await repo.setReportStatus(reportId, "approved");
  revalidatePath(reportPath(reportId));
}

export async function sendLinkAction(formData: FormData): Promise<void> {
  const reportId = String(formData.get("reportId") ?? "");
  const repo = getRepository();
  await repo.createShareLink(reportId);
  await repo.setReportStatus(reportId, "sent");
  await sendShareLink();
  revalidatePath(reportPath(reportId));
}
