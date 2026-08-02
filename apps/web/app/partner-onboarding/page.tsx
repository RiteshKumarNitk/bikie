"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  PartnerBusinessFields,
  emptyPartnerBusinessDetails,
  type PartnerBusinessDetails,
} from "@/components/auth/PartnerBusinessFields";
import { LogoMark } from "@/components/layout/LogoMark";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30";
const labelClassName = "text-sm font-medium";

export default function PartnerOnboardingPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [partnerDetails, setPartnerDetails] = useState<PartnerBusinessDetails>(
    emptyPartnerBusinessDetails,
  );

  const [referralCode, setReferralCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setReferralCode(ref);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setSaving(true);
    try {
      if (fullName.trim()) {
        await authClient.updateUser({ name: fullName.trim() });
      }
      if (referralCode.trim()) {
        await fetch("/api/referrals/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: referralCode.trim() }),
        }).catch(() => {});
      }
      const res = await fetch("/api/partner/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: partnerDetails.businessName,
          type: partnerDetails.type,
          city: partnerDetails.city,
          aadhaarNumber: partnerDetails.aadhaarNumber.trim() || undefined,
          contactPerson1Name: partnerDetails.contactPerson1Name.trim() || undefined,
          contactPerson1Mobile: partnerDetails.contactPerson1Mobile.trim() || undefined,
          contactPerson2Name: partnerDetails.contactPerson2Name.trim() || undefined,
          contactPerson2Mobile: partnerDetails.contactPerson2Mobile.trim() || undefined,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(data.error || "Failed to save partner profile");
      }
      
      router.push("/partner");
    } catch (err: any) {
      setError(err.message || "Something went wrong saving your details. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const busy = saving;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-6 py-16 lg:px-10">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <LogoMark size="lg" />
            <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
              BIKIE
            </span>
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-foreground md:text-4xl">
            Complete your Partner Profile
          </h1>
          <p className="mt-3 max-w-md text-base text-foreground/70">
            Tell us about your business. This helps us set up your fleet and payouts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass mt-10 space-y-8 rounded-3xl p-6 md:p-8 lg:p-10">
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">
              Your details
            </p>
            <div>
              <label className={labelClassName} htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="As per government ID"
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName} htmlFor="referralCode">
                Referral code <span className="font-normal text-foreground/50">(optional)</span>
              </label>
              <input
                id="referralCode"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. RID4F2A9"
                className={`${inputClassName} uppercase`}
              />
            </div>
          </section>

          <section className="space-y-4 border-t border-foreground/10 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">
              Business details
            </p>
            <PartnerBusinessFields
              value={partnerDetails}
              onChange={setPartnerDetails}
              idPrefix="onboarding-partner"
              showDescription={false}
            />
          </section>

          {error && (
            <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <div className="flex flex-col-reverse items-center gap-4 border-t border-foreground/10 pt-6 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-colors hover:bg-accent-hover disabled:opacity-50 sm:w-auto"
            >
              {saving ? "Saving…" : "Save & continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
