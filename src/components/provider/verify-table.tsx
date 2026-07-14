"use client";

import { useState } from "react";
import { confirmVerificationAction } from "@/app/provider/actions";
import { Button } from "@/components/ui/button";

interface EditableRow {
  rawName: string;
  value: string;
  unit: string;
  refLow: string;
  refHigh: string;
  rawRange: string;
  labFlags: string[];
}

const inputClasses =
  "w-full rounded border border-line bg-white px-2 py-1.5 text-sm text-ink focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30";

export function VerifyTable({
  reportId,
  rows,
}: {
  reportId: string;
  rows: EditableRow[];
}) {
  const [editable, setEditable] = useState<EditableRow[]>(rows);

  const update = (index: number, field: keyof EditableRow, value: string) => {
    setEditable((current) =>
      current.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const remove = (index: number) => {
    setEditable((current) => current.filter((_, i) => i !== index));
  };

  return (
    <form action={confirmVerificationAction}>
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="rows" value={JSON.stringify(editable)} />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="font-medium">Test</th>
              <th className="font-medium">Value</th>
              <th className="font-medium">Unit</th>
              <th className="font-medium">Ref low</th>
              <th className="font-medium">Ref high</th>
              <th className="sr-only">Remove</th>
            </tr>
          </thead>
          <tbody>
            {editable.map((row, index) => (
              <tr key={index}>
                <td className="pr-2">
                  <input
                    className={inputClasses}
                    value={row.rawName}
                    aria-label="Test name"
                    onChange={(event) => update(index, "rawName", event.target.value)}
                  />
                </td>
                <td className="pr-2">
                  <input
                    className={inputClasses}
                    value={row.value}
                    aria-label="Value"
                    onChange={(event) => update(index, "value", event.target.value)}
                  />
                </td>
                <td className="pr-2">
                  <input
                    className={inputClasses}
                    value={row.unit}
                    aria-label="Unit"
                    onChange={(event) => update(index, "unit", event.target.value)}
                  />
                </td>
                <td className="pr-2">
                  <input
                    className={inputClasses}
                    value={row.refLow}
                    aria-label="Reference low"
                    onChange={(event) => update(index, "refLow", event.target.value)}
                  />
                </td>
                <td className="pr-2">
                  <input
                    className={inputClasses}
                    value={row.refHigh}
                    aria-label="Reference high"
                    onChange={(event) => update(index, "refHigh", event.target.value)}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-xs text-muted hover:text-critical"
                    aria-label={`Remove ${row.rawName}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Button type="submit">Confirm results and draft explanation</Button>
      </div>
    </form>
  );
}
