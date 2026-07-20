import { cn } from '@/lib/ui/cn';

/** A neutral loading placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-line/70', className)} />;
}
