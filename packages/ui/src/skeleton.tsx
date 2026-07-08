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
