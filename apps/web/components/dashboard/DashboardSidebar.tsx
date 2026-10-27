"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export interface DashboardNavItem {
  label: string;
  href: string;
}

export function DashboardSidebar({
  groups,
  items,
  title,
}: {
  groups?: { label: string; items: DashboardNavItem[] }[];
  items: DashboardNavItem[];
  title: string;
}) {
  const resolvedGroups = groups ?? [{ label: title, items }];
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const active = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 self-start rounded-xl border border-white/10 px-4 py-2 text-sm font-medium md:hidden"
      >
        <span>☰</span> Menu
      </button>

      {open && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`${
          open ? "fixed inset-y-0 left-0 z-50 w-64 translate-x-0" : "hidden"
        } bg-background md:sticky md:top-24 md:block md:max-h-[calc(100vh-8rem)] md:w-56 md:bg-transparent`}
      >
        {/* `overflow-y-auto` lives on this inner div, not the `sticky` element above — a
            sticky-positioned element with its own overflow unreliably receives wheel events
            (the browser keeps scrolling the page instead of this box; dragging the scrollbar
            thumb still worked, which is what made it look like a thin/broken scrollbar rather
            than a dead one). Splitting sticky positioning (outer) from the scroll container
            (inner) is the standard fix. */}
        <div className="h-full overflow-y-auto p-6 md:p-0">
          <div className="flex items-center justify-between md:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">Navigation</p>
            <button onClick={() => setOpen(false)} className="text-white/50">✕</button>
          </div>

          {resolvedGroups.map((group) => (
            <div key={group.label} className="mt-5 first:mt-0">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">{group.label}</p>
              <nav className="mt-1 flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active(item.href)
                        ? "bg-accent text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}