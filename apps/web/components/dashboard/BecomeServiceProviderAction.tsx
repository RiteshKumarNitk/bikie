"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/** Rider -> Partner self-service upgrade entry point (ADR-013). Signs the rider out and
 * sends them through /welcome so the selectedRole cookie gets set to PARTNER, landing on
 * the phone+OTP login page — re-verifying the same phone number there completes the
 * upgrade via POST /api/user/become-partner. */
export function BecomeServiceProviderAction() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await authClient.signOut();
    window.location.href = "/welcome?next=/login";
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-xl border border-accent/30 bg-accent/[0.04] px-5 py-2.5 text-sm font-medium text-accent-text transition-colors hover:bg-accent/10 disabled:opacity-50"
    >
      {loading ? "Redirecting…" : "Become a Service Provider"}
    </button>
  );
}
