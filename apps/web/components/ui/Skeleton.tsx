export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl bg-white/5 p-5">
      <div className="h-3 w-16 rounded bg-white/10" />
      <div className="mt-2 h-7 w-20 rounded bg-white/10" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="mt-6 animate-pulse space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-xl bg-white/5 p-3">
          <div className="h-4 flex-1 rounded bg-white/10" />
          <div className="h-4 w-20 rounded bg-white/10" />
          <div className="h-4 w-32 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-white/5 p-4">
      <div className="h-4 w-32 rounded bg-white/10" />
      <div className="mt-4 h-[200px] rounded bg-white/10" />
    </div>
  );
}