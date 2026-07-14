import type { StatusEvent } from "@/lib/model/types";
import { reportStatusDisplay } from "@/lib/ui/report-status-display";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** The report's status history as a vertical timeline. */
export function StatusTimeline({ history }: { history: StatusEvent[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {history.map((event, index) => {
        const status = reportStatusDisplay(event.status);
        const isCurrent = index === history.length - 1;
        return (
          <li key={`${event.status}-${event.at}`} className="flex gap-3">
            <span
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isCurrent ? "bg-forest" : "bg-line"}`}
              aria-hidden
            />
            <div>
              <p className={`text-sm ${isCurrent ? "font-medium text-ink" : "text-muted"}`}>
                {status.label}
              </p>
              <p className="text-xs text-muted">{formatTime(event.at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
