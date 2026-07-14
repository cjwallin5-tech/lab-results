"use client";

import { approveDraftAction, saveDraftAction } from "@/app/provider/actions";
import { Button } from "@/components/ui/button";

interface DraftEntry {
  analyteId: string;
  displayName: string;
  text: string;
}

const textareaClasses =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm leading-relaxed text-ink focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20";

export function DraftEditor({
  reportId,
  overallText,
  entries,
  approved,
}: {
  reportId: string;
  overallText: string;
  entries: DraftEntry[];
  approved: boolean;
}) {
  return (
    <form className="flex flex-col gap-6">
      <input type="hidden" name="reportId" value={reportId} />

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Overall picture
        </label>
        <textarea name="overallText" rows={4} defaultValue={overallText} className={textareaClasses} />
      </div>

      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          <div key={entry.analyteId}>
            <label className="mb-1.5 block text-sm font-medium text-ink">{entry.displayName}</label>
            <textarea
              name={`text-${entry.analyteId}`}
              rows={3}
              defaultValue={entry.text}
              className={textareaClasses}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" formAction={saveDraftAction}>
          Save draft
        </Button>
        <Button type="submit" formAction={approveDraftAction}>
          {approved ? "Re-approve" : "Approve for the patient"}
        </Button>
      </div>
      <p className="text-xs text-muted">
        Nothing reaches the patient until you approve. Approved text is what they will read.
      </p>
    </form>
  );
}
