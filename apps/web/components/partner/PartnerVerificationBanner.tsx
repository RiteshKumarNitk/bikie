"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Application {
  status: string;
  profile: {
    submittedAt?: string | null;
    rejectionReason?: string | null;
    reviewNote?: string | null;
  } | null;
}

/**
 * FINAL PRODUCT MODEL — the verification-status banner on the provider dashboard. Verification
 * is a SEPARATE, OPTIONAL trust layer: the profile (and all provider capability) is active the
 * moment it exists, so this banner never blocks anything — it just tells the provider where
 * they stand (✓ BIKIE Verified / ⚠ Unverified / verification pending / not approved) and offers
 * the optional "Get Verified" / "Re-apply" action. Admin reviews verification, not existence.
 */
export function PartnerVerificationBanner() {
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/partner/application");
      if (!res.ok) return;
      const data = await res.json();
      setApplication(data);
    } catch {
      // Banner is informational — never crash the dashboard on a failed read.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submitForVerification() {
    setBusy(true);
    try {
      await fetch("/api/partner/application/submit", { method: "POST" });
      await load();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function reapply() {
    setBusy(true);
    try {
      await fetch("/api/partner/application/reapply", { method: "POST" });
      await load();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!application || application.status === "APPROVED") return null;

  const status = application.status;

  return (
    <div className="mt-4 rounded-2xl border border-foreground/10 bg-card p-4">
      {status === "PENDING_VERIFICATION" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-400">Verification pending — you can operate now</p>
            <p className="mt-0.5 text-xs text-foreground/60">
              An admin is reviewing your optional verification. Your Service Provider profile is
              already live and accepting requests.
            </p>
          </div>
        </div>
      )}
      {status === "REJECTED" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-400">⚠ Verification not approved</p>
            <p className="mt-0.5 text-xs text-foreground/60">
              {application.profile?.rejectionReason ?? "Your verification request was not approved."}{" "}
              Your profile stays active — you can keep operating as an unverified Service Provider.
            </p>
          </div>
          <button
            type="button"
            onClick={reapply}
            disabled={busy}
            className="rounded-full bg-foreground/10 px-4 py-1.5 text-xs font-semibold hover:bg-foreground/15 disabled:opacity-50"
          >
            {busy ? "Please wait…" : "Re-apply for verification"}
          </button>
        </div>
      )}
      {(status === "DRAFT" || status === "MORE_INFORMATION_REQUIRED") && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">⚠ Unverified Service Provider</p>
            <p className="mt-0.5 text-xs text-foreground/60">
              Your profile is live and you're fully operational. Get verified anytime to earn the
              ✓ BIKIE Verified badge and build rider trust.
            </p>
          </div>
          <button
            type="button"
            onClick={submitForVerification}
            disabled={busy}
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {busy ? "Please wait…" : "Get Verified"}
          </button>
        </div>
      )}
    </div>
  );
}
