import type { OutreachEntry } from "@/lib/model/types";
import { logOutreachAction } from "@/app/provider/actions";
import { SubmitButton } from "@/components/ui/submit-button";

export interface CriticalItem {
  analyteId: string;
  displayName: string;
  value: string;
  unit?: string;
  contacted?: OutreachEntry;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const inputClasses =
  "rounded border border-line bg-white px-2 py-1.5 text-sm text-ink focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30";

/** Requires the provider to log a direct contact for each critical result. */
export function OutreachPanel({ reportId, items }: { reportId: string; items: CriticalItem[] }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-critical/40 bg-critical-soft/40 p-5">
      <h3 className="font-display text-lg text-critical">Critical results need direct contact</h3>
      <p className="mt-1 text-sm text-ink/80">
        Reach the patient directly about each result below before sending their link. Each contact
        is logged for the record.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.analyteId} className="rounded-lg border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-ink">
                {item.displayName}{" "}
                <span className="font-normal text-muted">
                  {item.value}
                  {item.unit ? ` ${item.unit}` : ""}
                </span>
              </span>
              {item.contacted && (
                <span className="text-xs font-medium text-forest">
                  Contacted {formatTime(item.contacted.at)}
                </span>
              )}
            </div>

            {item.contacted ? (
              <p className="mt-2 text-sm text-muted">
                {item.contacted.method === "phone" ? "Phone call" : "Other contact"}
                {item.contacted.note ? `: ${item.contacted.note}` : ""}
              </p>
            ) : (
              <form action={logOutreachAction} className="mt-3 flex flex-col gap-2">
                <input type="hidden" name="reportId" value={reportId} />
                <input type="hidden" name="analyteId" value={item.analyteId} />
                <div className="flex flex-wrap gap-2">
                  <select name="method" aria-label="Contact method" className={inputClasses}>
                    <option value="phone">Phone call</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    name="note"
                    placeholder="How you reached them and what you discussed"
                    aria-label="Contact note"
                    className={`flex-1 ${inputClasses}`}
                  />
                </div>
                <div>
                  <SubmitButton size="sm" pendingLabel="Logging...">
                    Log direct contact
                  </SubmitButton>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
