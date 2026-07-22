'use client';

import { approveDraftAction, saveDraftAction } from '@/app/provider/actions';
import type { Tone } from '@/lib/ui/classification-display';
import { SubmitButton } from '@/components/ui/submit-button';
import { StatusPill } from '@/components/ui/status-pill';

export interface DraftEntry {
  analyteId: string;
  displayName: string;
  text: string;
  value: string;
  unit?: string;
  tone: Tone;
  statusLabel: string;
}

const textareaClasses =
  'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm leading-relaxed text-ink focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20';

/**
 * The provider's review of the drafted explanation before the approval gate.
 * Every field is editable so the provider owns the final wording (FR-10): Save
 * draft to keep revising, Approve to freeze it as what the patient reads. The
 * text originates from the grounded draft; the editor only corrects wording and
 * never invents medical content. Approved explanations are frozen at the write
 * layer, so this editor renders only while the report is still a draft.
 */
export function DraftEditor({
  reportId,
  overallText,
  entries,
}: {
  reportId: string;
  overallText: string;
  entries: DraftEntry[];
}) {
  return (
    <form className="flex flex-col gap-6">
      <input type="hidden" name="reportId" value={reportId} />

      <div>
        <label
          htmlFor="overallText"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted"
        >
          Overall picture
        </label>
        <textarea
          id="overallText"
          name="overallText"
          rows={4}
          defaultValue={overallText}
          className={textareaClasses}
        />
      </div>

      <div className="flex flex-col gap-5">
        {entries.map((entry) => (
          <div key={entry.analyteId}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor={`text-${entry.analyteId}`} className="text-sm font-medium text-ink">
                {entry.displayName}{' '}
                <span className="font-normal text-muted">
                  {entry.value}
                  {entry.unit ? ` ${entry.unit}` : ''}
                </span>
              </label>
              <StatusPill tone={entry.tone} label={entry.statusLabel} />
            </div>
            <textarea
              id={`text-${entry.analyteId}`}
              name={`text-${entry.analyteId}`}
              rows={3}
              defaultValue={entry.text}
              className={textareaClasses}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton variant="secondary" formAction={saveDraftAction} pendingLabel="Saving...">
          Save draft
        </SubmitButton>
        <SubmitButton formAction={approveDraftAction} pendingLabel="Approving...">
          Approve for the patient
        </SubmitButton>
      </div>
      <p className="text-xs text-muted">
        Nothing reaches the patient until you approve. Approved text is frozen; to change it after
        approval, start the report over.
      </p>
    </form>
  );
}
