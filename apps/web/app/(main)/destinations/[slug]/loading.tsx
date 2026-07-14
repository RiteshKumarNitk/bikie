import { Skeleton } from "@bikie/ui";

export default function DestinationDetailLoading() {
  return (
    <div className="pb-24">
      <Skeleton className="mt-4 aspect-[21/9] w-full rounded-none" />
      <div className="mx-auto max-w-7xl px-6 pt-10">
        <Skeleton className="h-4 w-2/3 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-1/2 rounded-lg" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
