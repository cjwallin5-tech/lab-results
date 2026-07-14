"use client";

import { saveProviderNoteAction } from "@/app/provider/actions";
import { SubmitButton } from "@/components/ui/submit-button";

/** A free-text note the provider keeps on the report. */
export function ProviderNotes({ reportId, note }: { reportId: string; note: string }) {
  return (
    <form action={saveProviderNoteAction} className="flex flex-col gap-2">
      <input type="hidden" name="reportId" value={reportId} />
      <textarea
        name="note"
        rows={3}
        defaultValue={note}
        placeholder="Notes for yourself about this report..."
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
      />
      <div>
        <SubmitButton size="sm" variant="secondary" pendingLabel="Saving...">
          Save note
        </SubmitButton>
      </div>
    </form>
  );
}
