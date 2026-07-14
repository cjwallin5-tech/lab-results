"use client";

import { useState } from "react";
import type { AnalyteEntry } from "@/lib/model/types";
import { confirmVerificationAction } from "@/app/provider/actions";
import { classifyRow } from "@/lib/classify";
import { matchAnalyteIn } from "@/lib/analytes/match";
import { classificationDisplay } from "@/lib/ui/classification-display";
import { cn } from "@/lib/ui/cn";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusPill } from "@/components/ui/status-pill";

interface EditableRow {
  rawName: string;
  value: string;
  unit: string;
  refLow: string;
  refHigh: string;
  rawRange: string;
  labFlags: string[];
  lowConfidenceFields: string[];
}

const inputBase =
  "w-full rounded border bg-white px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-forest/30";

function emptyRow(): EditableRow {
  return {
    rawName: "",
    value: "",
    unit: "",
    refLow: "",
    refHigh: "",
    rawRange: "",
    labFlags: [],
    lowConfidenceFields: [],
  };
}

export function VerifyTable({
  reportId,
  rows,
  dictionary,
}: {
  reportId: string;
  rows: EditableRow[];
  dictionary: AnalyteEntry[];
}) {
  const [editable, setEditable] = useState<EditableRow[]>(rows);

  const update = (index: number, field: keyof EditableRow, value: string) => {
    setEditable((current) =>
      current.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };
  const remove = (index: number) => setEditable((current) => current.filter((_, i) => i !== index));
  const add = () => setEditable((current) => [...current, emptyRow()]);

  function previewFor(row: EditableRow) {
    const analyte = matchAnalyteIn(dictionary, row.rawName);
    return classificationDisplay(
      classifyRow({
        value: row.value,
        unit: row.unit || undefined,
        refLow: row.refLow || undefined,
        refHigh: row.refHigh || undefined,
        labFlags: row.labFlags,
        analyte,
      }),
    );
  }

  function fieldClass(row: EditableRow, field: string) {
    const low = row.lowConfidenceFields.includes(field);
    return cn(inputBase, low ? "border-amber ring-1 ring-amber/40" : "border-line");
  }

  const anyLowConfidence = editable.some((row) => row.lowConfidenceFields.length > 0);

  return (
    <form action={confirmVerificationAction}>
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="rows" value={JSON.stringify(editable)} />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="font-medium">Test</th>
              <th className="font-medium">Value</th>
              <th className="font-medium">Unit</th>
              <th className="font-medium">Ref low</th>
              <th className="font-medium">Ref high</th>
              <th className="font-medium">Will show as</th>
              <th className="sr-only">Remove</th>
            </tr>
          </thead>
          <tbody>
            {editable.map((row, index) => {
              const preview = previewFor(row);
              return (
                <tr key={index}>
                  <td className="pr-2">
                    <input
                      className={fieldClass(row, "rawName")}
                      value={row.rawName}
                      aria-label="Test name"
                      onChange={(event) => update(index, "rawName", event.target.value)}
                    />
                  </td>
                  <td className="pr-2">
                    <input
                      className={fieldClass(row, "value")}
                      value={row.value}
                      aria-label="Value"
                      onChange={(event) => update(index, "value", event.target.value)}
                    />
                  </td>
                  <td className="pr-2">
                    <input
                      className={fieldClass(row, "unit")}
                      value={row.unit}
                      aria-label="Unit"
                      onChange={(event) => update(index, "unit", event.target.value)}
                    />
                  </td>
                  <td className="pr-2">
                    <input
                      className={fieldClass(row, "refLow")}
                      value={row.refLow}
                      aria-label="Reference low"
                      onChange={(event) => update(index, "refLow", event.target.value)}
                    />
                  </td>
                  <td className="pr-2">
                    <input
                      className={fieldClass(row, "refHigh")}
                      value={row.refHigh}
                      aria-label="Reference high"
                      onChange={(event) => update(index, "refHigh", event.target.value)}
                    />
                  </td>
                  <td className="pr-2">
                    {row.rawName.trim() !== "" && (
                      <StatusPill tone={preview.tone} label={preview.label} />
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-xs text-muted hover:text-critical"
                      aria-label={`Remove ${row.rawName || "row"}`}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-2 text-sm font-medium text-forest hover:underline"
      >
        Add a row
      </button>

      {anyLowConfidence && (
        <p className="mt-3 text-xs text-amber">
          Amber fields were read with low confidence. Check them against the report before you
          confirm.
        </p>
      )}

      <div className="mt-6">
        <SubmitButton pendingLabel="Classifying...">
          Confirm results and draft explanation
        </SubmitButton>
      </div>
    </form>
  );
}
