import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@bikie/utils";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]",
        className,
      )}
      {...props}
    />
  ),
);

Card.displayName = "Card";
