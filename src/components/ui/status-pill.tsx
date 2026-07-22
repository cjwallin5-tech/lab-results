import { cn } from '@/lib/ui/cn';
import type { Tone } from '@/lib/ui/classification-display';

const TONE_STYLES: Record<Tone, string> = {
  in: 'bg-forest-soft text-forest',
  high: 'bg-amber-soft text-amber',
  low: 'bg-amber-soft text-amber',
  critical: 'bg-critical-soft text-critical',
  neutral: 'bg-line/70 text-ink',
};

const DOT_STYLES: Record<Tone, string> = {
  in: 'bg-forest',
  high: 'bg-amber',
  low: 'bg-amber',
  critical: 'bg-critical',
  neutral: 'bg-muted',
};

export function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        TONE_STYLES[tone],
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', DOT_STYLES[tone])} aria-hidden />
      {label}
    </span>
  );
}
