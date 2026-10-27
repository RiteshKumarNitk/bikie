"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useConfirm } from "@/components/ui/ConfirmDialog";

/**
 * Self-service account deletion — only rendered for a signed-in visitor (the rest of
 * `/delete-account` stays reachable logged-out, since Google Play requires the policy page itself
 * to work without an account). Blocked server-side (`POST /api/user/delete-account`) while a
 * Rider or Service Provider Razorpay Subscription is still actively auto-renewing — the message
 * below surfaces exactly that reason rather than a generic failure.
 */
export function DeleteAccountSection() {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const ok = await confirm(
      "Delete your account?",
      "This permanently removes your profile and cannot be undone. If you have history on the platform (bookings, reviews, organized rides), your data is anonymized instead of fully erased — see the policy above.",
    );
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/user/delete-account", { method: "POST" });
      const data = await res.json().catch(() => ({}) as { message?: string });
      if (!res.ok) {
        throw new Error(typeof data.message === "string" ? data.message : "Could not delete your account.");
      }
      await authClient.signOut();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold">Delete My Account Now</h2>
      <p className="mt-4 text-foreground/80 leading-relaxed">
        Signed in and ready to go? You can delete your account directly here instead of emailing
        support.
      </p>
      {error && (
        <div className="mt-4 rounded-2xl bg-red-500/10 px-6 py-4 text-sm text-red-400">{error}</div>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="mt-6 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
      >
        {busy ? "Deleting…" : "Delete My Account"}
      </button>
      {dialog}
    </section>
  );
}
