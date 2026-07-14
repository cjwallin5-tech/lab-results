import { Skeleton } from "@/components/ui/skeleton";

export default function ReportLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-6 h-6 w-full max-w-lg" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}
