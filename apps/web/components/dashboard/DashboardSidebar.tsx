"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface DashboardNavItem {
  label: string;
  href: string;
}

export function DashboardSidebar({ items, title }: { items: DashboardNavItem[]; title: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 md:w-56">
      <p className="px-3 text-xs font-semibold uppercase tracking-wide text-foreground/50">{title}</p>
      <nav className="mt-3 flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium ${
                active ? "bg-accent text-white" : "hover:bg-foreground/5"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
