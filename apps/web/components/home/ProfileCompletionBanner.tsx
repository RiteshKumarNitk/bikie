"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

/**
 * Reminds a rider who skipped `/onboarding` (and never substantively filled the profile in
 * since) that it's still worth completing — driven by `GET /api/rider-profile`'s
 * `showCompletionReminder` flag (see `RiderProfileService.needsCompletionReminder`). Dismissal
 * is intentionally not persisted: closing it only hides it for the current page view, so it
 * naturally reappears next time Home loads rather than needing a scheduled reminder — matches
 * ADR-012's "optional, never blocking" stance on rider-profile completion.
 */
export function ProfileCompletionBanner() {
  const { data: session } = authClient.useSession();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // ADR-046b: every account has baseline Rider capability now (RENTER by default, dual-capable
    // once approved as a Service Provider too) — only ADMIN has no Rider profile to complete.
    if (session?.user.role === "ADMIN") return;
    fetch("/api/rider-profile")
      .then((r) => r.json())
      .then((data: { showCompletionReminder?: boolean }) => setShow(Boolean(data.showCompletionReminder)))
      .catch(() => {});
  }, [session]);

  if (!show || dismissed) return null;

  return (
    <div className="mx-auto max-w-7xl px-6 pt-6">
      <div className="glass flex flex-col items-start gap-3 rounded-2xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground/80">
          <span className="font-medium">Finish setting up your rider profile</span> — vehicle, emergency
          contacts, and government ID make your SOS alerts far more useful to whoever responds.
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/onboarding"
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Complete profile
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="text-foreground/40 hover:text-foreground/70"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
