"use client";

import { useActionState } from "react";
import { saveProviderNoteAction, type NoteState } from "@/app/provider/actions";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: NoteState = {};

/** A free-text note the provider keeps on the report. */
export function ProviderNotes({ reportId, note }: { reportId: string; note: string }) {
  const [state, formAction] = useActionState(saveProviderNoteAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="reportId" value={reportId} />
      <textarea
        name="note"
        rows={3}
        defaultValue={note}
        placeholder="Notes for yourself about this report..."
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
      />
      <div className="flex items-center gap-3">
        <SubmitButton size="sm" variant="secondary" pendingLabel="Saving...">
          Save note
        </SubmitButton>
        <span aria-live="polite" className="text-xs text-forest">
          {state.saved ? "Saved" : ""}
        </span>
      </div>
    </form>
  );
}
