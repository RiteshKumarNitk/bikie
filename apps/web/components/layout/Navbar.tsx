"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import type { SelectedRole } from "@/lib/role";
import { switchActiveMode } from "@/lib/actions/role-actions";
import { LogoMark } from "./LogoMark";
import { MegaMenu } from "./MegaMenu";
import { NotificationBell } from "./NotificationBell";
import {
  partnerMegaMenuColumns,
  partnerPrimaryLinks,
  riderMegaMenuColumns,
  riderPrimaryLinks,
} from "./nav-config";

/** ADMIN -> /admin; else by the current active mode (ADR-046b) — `activeMode` is the same
 * `selectedRole` cookie value the layout already reads to pick the nav variant, passed down as
 * this component's own `role` prop. */
function dashboardHrefForRole(sessionRole: string | undefined, activeMode: SelectedRole | null) {
  if (sessionRole === "ADMIN") return "/admin";
  return activeMode === "PARTNER" ? "/partner" : "/dashboard";
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent-text">
      {initials}
    </div>
  );
}

export function Navbar({ role }: { role: SelectedRole | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);

  // A visitor with no explicit role selection yet (every first-time visit, and every
  // crawler) still needs a working nav — default that state to the rider/public
  // experience rather than rendering an empty header. See DECISIONS.md.
  const primaryLinks = role === "PARTNER" ? partnerPrimaryLinks : riderPrimaryLinks;
  const megaMenuColumns = role === "PARTNER" ? partnerMegaMenuColumns : riderMegaMenuColumns;

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
        userMenuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [userMenuOpen]);

  const dashboardHref = dashboardHrefForRole(session?.user.role, role);
  const isApprovedPartner = session?.user.partnerStatus === "APPROVED";

  const navLinkClass = "text-sm font-medium text-foreground/70 hover:text-foreground transition-colors";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "nav-blur shadow-lg shadow-black/10" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="font-display text-lg font-semibold tracking-tight">BIKIE</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {primaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
          <MegaMenu label="More" columns={megaMenuColumns} />
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!isPending && session && <NotificationBell />}
          {!isPending && session ? (
            <div className="relative" ref={userMenuRef}>
              <button
                ref={userMenuButtonRef}
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2 rounded-full border border-foreground/10 p-1 pl-2 pr-3 transition-colors hover:bg-foreground/5"
              >
                <UserAvatar name={session.user.name} />
                <span className="text-sm font-medium">{session.user.name.split(" ")[0]}</span>
                <svg className={`h-3 w-3 text-foreground/50 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    role="menu"
                    aria-orientation="vertical"
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-foreground/10 bg-card p-2 shadow-xl"
                  >
                    <div className="border-b border-foreground/10 px-3 py-2">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      {/* Hide Better Auth phone-OTP placeholder emails (phone-…@bikie.local). */}
                      {session.user.email && !session.user.email.endsWith("@bikie.local") && (
                        <p className="text-xs text-foreground/50">{session.user.email}</p>
                      )}
                      <span className="mt-1 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-text">
                        {session.user.role}
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <Link
                        href={dashboardHref}
                        onClick={() => setUserMenuOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-foreground/5"
                      >
                        <svg className="h-4 w-4 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                      </Link>
                      {isApprovedPartner && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            switchActiveMode(role === "PARTNER" ? "RIDER" : "PARTNER");
                          }}
                          role="menuitem"
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-foreground/5"
                        >
                          <svg className="h-4 w-4 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          Switch to {role === "PARTNER" ? "Rider" : "Service Provider"} mode
                        </button>
                      )}
                      <Link
                        href={session.user.role === "ADMIN" ? "/admin/settings" : role === "PARTNER" ? "/partner/settings" : "/dashboard/settings"}
                        onClick={() => setUserMenuOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-foreground/5"
                      >
                        <svg className="h-4 w-4 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          await authClient.signOut();
                          setUserMenuOpen(false);
                          window.location.href = "/";
                        }}
                        role="menuitem"
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-5 py-2 text-sm font-medium ring-1 ring-foreground/15 hover:bg-foreground/5 transition-all">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-all shadow-lg shadow-accent/20"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="relative z-50 flex h-10 w-10 items-center justify-center md:hidden"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <div className="flex flex-col gap-1.5">
            <span className={`block h-0.5 w-5 rounded-full bg-foreground transition-all ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 rounded-full bg-foreground transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 rounded-full bg-foreground transition-all ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 flex h-full w-80 flex-col overflow-y-auto bg-surface p-6 pt-20 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-6">
                {megaMenuColumns.map((column) => (
                  <div key={column.heading}>
                    <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">{column.heading}</p>
                    <nav className="flex flex-col gap-1">
                      {column.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-foreground/5 transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3 border-t border-foreground/10 pt-6">
                {!isPending && session && <NotificationBell />}
                {!isPending && session ? (
                  <Link
                    href={dashboardHref}
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 rounded-full bg-accent px-4 py-2.5 text-center text-sm font-medium text-white"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 rounded-full bg-foreground/10 px-4 py-2.5 text-center text-sm font-medium"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 rounded-full bg-accent px-4 py-2.5 text-center text-sm font-medium text-white"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
