import { Skeleton } from '@/components/ui/skeleton';

export default function ProviderLoading() {
  return (
    <div>
      <Skeleton className="h-9 w-40" />
      <div className="mt-8 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
