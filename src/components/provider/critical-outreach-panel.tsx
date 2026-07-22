import type { OutreachEntry } from '@/lib/types';
import { logOutreachAction } from '@/app/provider/actions';
import { OUTREACH_NOTE_MAX } from '@/lib/ui/outreach';
import { StatusPill } from '@/components/ui/status-pill';
import { SubmitButton } from '@/components/ui/submit-button';

export interface CriticalItem {
  analyteId?: string;
  displayName: string;
  value: string;
  unit?: string;
  contacts: OutreachEntry[];
}

const METHOD_LABEL: Record<OutreachEntry['method'], string> = {
  phone: 'Phone',
  other: 'Other',
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const inputClasses =
  'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20';

/**
 * The held-report panel (FR-07): a critical result holds the whole report, so
 * nothing is drafted or sent. The provider reaches the patient directly about
 * each critical result and records that contact here. Logging never lifts the
 * hold and never produces a patient page; it only documents the callback.
 */
export function CriticalOutreachPanel({
  reportId,
  items,
  outstandingCount,
}: {
  reportId: string;
  items: CriticalItem[];
  outstandingCount: number;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-critical/40 bg-critical-soft/40 p-6">
      <h2 className="font-display text-xl text-critical">Held: contact the patient directly</h2>
      <p className="mt-1 max-w-prose text-sm text-ink/80">
        This report has a critical result, so nothing is drafted or sent to the patient. Reach the
        patient directly about each result below, then record the contact for your records.
      </p>
      <p className="mt-3 text-sm font-medium text-ink">
        {outstandingCount === 0
          ? 'Every critical result has a logged contact.'
          : `${outstandingCount} of ${items.length} still to contact.`}
      </p>

      <ul className="mt-5 flex flex-col gap-4">
        {items.map((item, index) => {
          const contacted = item.contacts.length > 0;
          return (
            <li
              key={item.analyteId ?? `${item.displayName}-${index}`}
              className="rounded-lg border border-line bg-paper p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-ink">
                  {item.displayName}{' '}
                  <span className="font-normal text-muted">
                    {item.value}
                    {item.unit ? ` ${item.unit}` : ''}
                  </span>
                </span>
                <StatusPill
                  tone={contacted ? 'in' : 'critical'}
                  label={contacted ? 'Contacted' : 'Needs prompt attention'}
                />
              </div>

              {contacted && (
                <ul className="mt-3 flex flex-col gap-2 border-l-2 border-forest/30 pl-3">
                  {item.contacts.map((contact, contactIndex) => (
                    <li key={contactIndex} className="text-sm">
                      <span className="text-muted">
                        {METHOD_LABEL[contact.method]} · {formatWhen(contact.at)}
                      </span>
                      <p className="mt-0.5 text-ink/90">{contact.note}</p>
                    </li>
                  ))}
                </ul>
              )}

              {item.analyteId ? (
                <form action={logOutreachAction} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="reportId" value={reportId} />
                  <input type="hidden" name="analyteId" value={item.analyteId} />
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor={`method-${item.analyteId}`}
                      className="text-xs font-semibold uppercase tracking-wide text-muted"
                    >
                      How you reached them
                    </label>
                    <select
                      id={`method-${item.analyteId}`}
                      name="method"
                      defaultValue="phone"
                      className={`${inputClasses} w-auto`}
                    >
                      <option value="phone">Phone</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <label htmlFor={`note-${item.analyteId}`} className="sr-only">
                    What you told the patient about {item.displayName}
                  </label>
                  <textarea
                    id={`note-${item.analyteId}`}
                    name="note"
                    required
                    maxLength={OUTREACH_NOTE_MAX}
                    rows={2}
                    placeholder="Who you reached and what you told them."
                    className={inputClasses}
                  />
                  <div>
                    <SubmitButton variant="secondary" pendingLabel="Recording...">
                      {contacted ? 'Add another contact' : 'Record contact'}
                    </SubmitButton>
                  </div>
                </form>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  This result is not in the dictionary, so record the contact in your clinic&apos;s
                  system.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
