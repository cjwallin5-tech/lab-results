import { cn } from '@/lib/ui/cn';
import type { Tone } from '@/lib/ui/classification-display';

/**
 * A horizontal scale with the typical range highlighted and a marker at the
 * patient's value. Handles one-sided ranges (only a low or only a high). Purely
 * presentational: it is given numbers, it never classifies.
 */

interface RangeMarkerProps {
  value: number;
  low?: number;
  high?: number;
  tone: Tone;
}

const DOT: Record<Tone, string> = {
  in: 'bg-forest',
  high: 'bg-amber',
  low: 'bg-amber',
  critical: 'bg-critical',
  neutral: 'bg-muted',
};

function format(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function typicalLabel(low?: number, high?: number): string {
  if (low !== undefined && high !== undefined) return `typical: ${format(low)} to ${format(high)}`;
  if (high !== undefined) return `typical: under ${format(high)}`;
  if (low !== undefined) return `typical: ${format(low)} or higher`;
  return '';
}

export function RangeMarker({ value, low, high, tone }: RangeMarkerProps) {
  let min = Math.min(value, low ?? value, high ?? value);
  let max = Math.max(value, low ?? value, high ?? value);

  if (low !== undefined && high !== undefined) {
    const pad = (high - low) * 0.6 || Math.abs(high) * 0.2 || 1;
    min = Math.min(min, low - pad);
    max = Math.max(max, high + pad);
  } else if (high !== undefined) {
    min = Math.min(min, 0);
    max = Math.max(max, high * 1.6);
  } else if (low !== undefined) {
    min = Math.min(min, low * 0.5);
    max = Math.max(max, low * 1.8);
  }
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const spread = max - min;
  if (value < min) min = value - spread * 0.1;
  if (value > max) max = value + spread * 0.1;

  const pos = (x: number) => Math.min(100, Math.max(0, ((x - min) / (max - min)) * 100));
  const bandStart = low !== undefined ? pos(low) : 0;
  const bandEnd = high !== undefined ? pos(high) : 100;

  return (
    <div className="mt-4">
      <div className="relative h-1.5 w-full rounded-full bg-line">
        <div
          className="absolute h-1.5 rounded-full bg-forest/25"
          style={{ left: `${bandStart}%`, width: `${bandEnd - bandStart}%` }}
        />
        <div
          className={cn(
            'absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-cream',
            DOT[tone],
          )}
          style={{ left: `${pos(value)}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted">
        <span>{format(min)}</span>
        <span className="font-medium text-forest">{typicalLabel(low, high)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}
