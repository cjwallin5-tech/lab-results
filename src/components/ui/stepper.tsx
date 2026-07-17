import { cn } from '@/lib/ui/cn';

/** The provider workflow progress indicator. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex items-center gap-3">
            {index > 0 && <span aria-hidden className="hidden h-px w-8 bg-line sm:block" />}
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  done && 'bg-forest text-cream',
                  active && 'bg-forest text-cream ring-2 ring-forest/25',
                  !done && !active && 'bg-line text-muted',
                )}
              >
                {index + 1}
              </span>
              <span className={cn(active ? 'font-medium text-ink' : 'text-muted')}>{step}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
