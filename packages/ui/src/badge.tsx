import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@bikie/utils";

export const Badge = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium",
        className,
      )}
      {...props}
    />
  ),
);

Badge.displayName = "Badge";
