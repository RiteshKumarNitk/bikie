"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "./ThemeToggle";
import { MegaMenu } from "./MegaMenu";

function dashboardHrefForRole(role: string | undefined) {
  if (role === "ADMIN") return "/admin";
  if (role === "PARTNER") return "/partner";
  return "/dashboard";
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashboardHref = dashboardHrefForRole(session?.user.role);

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${scrolled ? "glass shadow-sm" : "bg-transparent"}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl font-semibold">
          BIKIE
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <MegaMenu />
          <Link href="/trips">Trips</Link>
          <Link href="/become-a-partner">Become a Partner</Link>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <ThemeToggle />
          {!isPending && session ? (
            <Link
              href={dashboardHref}
              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent/90"
            >
              {session.user.name.split(" ")[0]}&apos;s Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent/90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div className="glass mx-4 mb-4 rounded-3xl px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-4 text-sm font-medium">
            <Link href="/explore-bikes" onClick={() => setMenuOpen(false)}>
              Explore Bikes
            </Link>
            <Link href="/destinations" onClick={() => setMenuOpen(false)}>
              Destinations
            </Link>
            <Link href="/trips" onClick={() => setMenuOpen(false)}>
              Trips
            </Link>
            <Link href="/community" onClick={() => setMenuOpen(false)}>
              Community
            </Link>
            <Link href="/roadside-assistance" onClick={() => setMenuOpen(false)}>
              Roadside Assistance
            </Link>
            <Link href="/become-a-partner" onClick={() => setMenuOpen(false)}>
              Become a Partner
            </Link>
            <Link href="/about" onClick={() => setMenuOpen(false)}>
              About Us
            </Link>
            <Link href="/faq" onClick={() => setMenuOpen(false)}>
              Help Center
            </Link>
            <div className="mt-2 flex items-center justify-between">
              <ThemeToggle />
              {!isPending && session ? (
                <Link href={dashboardHref} onClick={() => setMenuOpen(false)} className="font-medium text-accent">
                  Dashboard
                </Link>
              ) : (
                <div className="flex gap-4">
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    Log in
                  </Link>
                  <Link href="/signup" onClick={() => setMenuOpen(false)}>
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
