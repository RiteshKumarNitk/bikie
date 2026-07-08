import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@bikie/utils";

export const GlassPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("glass rounded-3xl", className)} {...props} />
  ),
);

GlassPanel.displayName = "GlassPanel";
