import { type HTMLAttributes } from "react";
import { cn } from "@bikie/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-3xl bg-foreground/10", className)}
      {...props}
    />
  );
}

/** Compact stat-tile placeholder for dashboard/admin summary rows. */
export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl bg-foreground/5 p-5">
      <div className="h-3 w-16 rounded bg-foreground/10" />
      <div className="mt-2 h-7 w-20 rounded bg-foreground/10" />
    </div>
  );
}

/** Placeholder for a list/table of rows (admin tables, dashboard lists). */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="mt-6 animate-pulse space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-xl bg-foreground/5 p-3">
          <div className="h-4 flex-1 rounded bg-foreground/10" />
          <div className="h-4 w-20 rounded bg-foreground/10" />
          <div className="h-4 w-32 rounded bg-foreground/10" />
        </div>
      ))}
    </div>
  );
}

/** Placeholder for a chart panel (admin analytics). */
export function ChartSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-foreground/5 p-4">
      <div className="h-4 w-32 rounded bg-foreground/10" />
      <div className="mt-4 h-[200px] rounded bg-foreground/10" />
    </div>
  );
}
