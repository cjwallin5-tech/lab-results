import { Skeleton } from '@/components/ui/skeleton';

export default function PatientLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-12 w-full max-w-lg" />
      <Skeleton className="h-28" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );
}
