"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "./ThemeToggle";

function dashboardHrefForRole(role: string | undefined) {
  if (role === "ADMIN") return "/admin";
  if (role === "PARTNER") return "/partner";
  return "/dashboard";
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
      {initials}
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  const dashboardHref = dashboardHrefForRole(session?.user.role);

  const navLinks = [
    { label: "Explore", href: "/explore-bikes" },
    { label: "Destinations", href: "/destinations" },
    { label: "Trips", href: "/trips" },
    { label: "Become a Partner", href: "/become-a-partner" },
  ];

  const navLinkClass = "text-sm font-medium text-foreground/70 hover:text-foreground transition-colors";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "nav-blur shadow-lg shadow-black/10" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
            B
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">BIKIE</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {!isPending && session ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
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
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-foreground/10 bg-card p-2 shadow-xl"
                  >
                    <div className="border-b border-foreground/10 px-3 py-2">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-foreground/50">{session.user.email}</p>
                      <span className="mt-1 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                        {session.user.role}
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <Link
                        href={dashboardHref}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-foreground/5"
                      >
                        <svg className="h-4 w-4 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                      </Link>
                      <Link
                        href={session.user.role === "ADMIN" ? "/admin/settings" : session.user.role === "PARTNER" ? "/partner/settings" : "/dashboard/settings"}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-foreground/5"
                      >
                        <svg className="h-4 w-4 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          await authClient.signOut();
                          setUserMenuOpen(false);
                          window.location.href = "/";
                        }}
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
              className="absolute right-0 top-0 h-full w-80 bg-surface p-6 pt-20 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-foreground/5 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-3 border-foreground/10" />
                <Link
                  href="/community"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-foreground/5 transition-colors"
                >
                  Community
                </Link>
                <Link
                  href="/roadside-assistance"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-foreground/5 transition-colors"
                >
                  Roadside Assistance
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-foreground/5 transition-colors"
                >
                  About Us
                </Link>
                <Link
                  href="/faq"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-foreground/5 transition-colors"
                >
                  Help Center
                </Link>
              </nav>
              <div className="mt-6 flex items-center gap-3 border-t border-foreground/10 pt-6">
                <ThemeToggle />
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
