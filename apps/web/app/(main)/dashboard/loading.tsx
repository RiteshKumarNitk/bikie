import { Skeleton, StatCardSkeleton } from "@bikie/ui";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 rounded-xl" />
      <div className="flex flex-wrap gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <Skeleton className="h-64 w-full rounded-3xl" />
    </div>
  );
}
