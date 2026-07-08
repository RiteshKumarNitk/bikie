import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-foreground/15 px-6 py-16 text-center">
      {icon && <div className="text-4xl">{icon}</div>}
      <p className="text-lg font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-foreground/60">{description}</p>}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent/90"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
