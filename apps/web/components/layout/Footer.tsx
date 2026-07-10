import Link from "next/link";
import type { SelectedRole } from "@/lib/role";
import {
  legalFooterColumn,
  otherRole,
  partnerFooterColumns,
  riderFooterColumns,
  switchRoleLabel,
} from "./nav-config";
import { SwitchRoleLink } from "./SwitchRoleLink";

export function Footer({ role }: { role: SelectedRole | null }) {
  const columns = [...(role === "PARTNER" ? partnerFooterColumns : riderFooterColumns), legalFooterColumn];

  return (
    <footer className="border-t border-foreground/10 bg-surface/50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-6">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
                B
              </div>
              <span className="font-display text-lg font-semibold tracking-tight">BIKIE</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-foreground/50 leading-relaxed">
              India&apos;s premium motorcycle travel platform. Rent premium motorcycles at stunning destinations across the country.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { label: "Instagram", href: "https://instagram.com" },
                { label: "Facebook", href: "https://facebook.com" },
                { label: "YouTube", href: "https://youtube.com" },
                { label: "X", href: "https://x.com" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/10 text-xs text-foreground/50 transition-all hover:border-accent hover:text-accent-text hover:bg-accent/10"
                  aria-label={social.label}
                >
                  {social.label[0]}
                </a>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl border border-foreground/10 px-4 py-2 text-xs text-foreground/50 transition-colors hover:border-foreground/20">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Google Play
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-foreground/10 px-4 py-2 text-xs text-foreground/50 transition-colors hover:border-foreground/20">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                App Store
              </span>
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.heading}>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">{column.heading}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-foreground/60 transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-foreground/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row">
          <p className="text-xs text-foreground/40">
            © {new Date().getFullYear()} BIKIE. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-foreground/40">
            <Link href="/privacy-policy" className="hover:text-foreground/60">Privacy</Link>
            <Link href="/terms-and-conditions" className="hover:text-foreground/60">Terms</Link>
            <Link href="/cookie-policy" className="hover:text-foreground/60">Cookies</Link>
            {role && (
              <SwitchRoleLink to={otherRole(role)} className="text-accent-text hover:underline">
                {switchRoleLabel(role)}
              </SwitchRoleLink>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
