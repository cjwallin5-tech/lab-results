"use client";

import { useActionState } from "react";
import { uploadReportAction, type FormState } from "@/app/provider/actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

const initialState: FormState = {};

export function UploadForm({ reports }: { reports: { value: string; label: string }[] }) {
  const [state, formAction, pending] = useActionState(uploadReportAction, initialState);

  return (
    <form action={formAction} className="mt-8 flex max-w-xl flex-col gap-4">
      <TextField label="Patient name" name="name" placeholder="Maria Alvarez" defaultValue="" />
      <TextField
        label="Patient email"
        name="email"
        type="email"
        placeholder="patient@example.test"
        defaultValue=""
      />
      <TextField label="Patient date of birth" name="dob" type="date" defaultValue="" />

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Report to upload
        </span>
        <select
          name="pdfRef"
          defaultValue=""
          className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
        >
          <option value="" disabled>
            Choose a synthetic report
          </option>
          {reports.map((report) => (
            <option key={report.value} value={report.value}>
              {report.label}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-muted">
          This version reads from a set of synthetic lab reports. No real PDF is uploaded.
        </span>
      </label>

      {state.error && <p className="text-sm text-critical">{state.error}</p>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create report"}
        </Button>
      </div>
    </form>
  );
}
