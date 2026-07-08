"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const labelMap: Record<string, string> = {
  admin: "Admin",
  "audit-logs": "Audit Logs",
  sos: "SOS",
  testimonials: "Testimonials",
  email: "Email",
  sms: "SMS",
  reports: "Reports",
  settings: "Settings",
  users: "Users",
  partners: "Partners",
  bikes: "Bikes",
  bookings: "Bookings",
  trips: "Trips",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    return { label: labelMap[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1), href };
  });

  return (
    <nav className="mb-4 flex items-center gap-1.5 text-xs text-white/40 md:mb-6">
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex items-center gap-1.5">
          {i > 0 && <span>/</span>}
          {i === crumbs.length - 1 ? (
            <span className="text-white/70">{c.label}</span>
          ) : (
            <Link href={c.href} className="transition-colors hover:text-white">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}