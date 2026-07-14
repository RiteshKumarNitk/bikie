import { Skeleton } from "@bikie/ui";

export default function BikeDetailLoading() {
  return (
    <div className="pb-24">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <Skeleton className="h-5 w-64 rounded-lg" />
        <Skeleton className="mt-6 h-[420px] w-full rounded-3xl" />
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-8 w-2/3 rounded-lg" />
            <Skeleton className="h-4 w-1/3 rounded-lg" />
            <Skeleton className="mt-4 h-40 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
