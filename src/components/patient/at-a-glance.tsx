import type { ToneCounts } from '@/lib/ui/results-view';
import { StatusPill } from '@/components/ui/status-pill';

/** A compact count-chip summary of the whole report. */
export function AtAGlance({ counts }: { counts: ToneCounts }) {
  const chips = [
    { n: counts.inRange, label: 'in typical range', tone: 'in' as const },
    { n: counts.outside, label: 'a little outside', tone: 'high' as const },
    { n: counts.flagged, label: 'to double-check', tone: 'neutral' as const },
    { n: counts.notCovered, label: 'not explained here', tone: 'neutral' as const },
  ].filter((chip) => chip.n > 0);

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <StatusPill key={chip.label} tone={chip.tone} label={`${chip.n} ${chip.label}`} />
      ))}
    </div>
  );
}
