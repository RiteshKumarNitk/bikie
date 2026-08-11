"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PartnerApplicationDTO } from "@bikie/types";
import { partnerProfileSchema } from "@bikie/validation";
import { formatZodError } from "@/lib/format-zod-error";
import {
  PartnerBusinessFields,
  emptyPartnerBusinessDetails,
  type PartnerBusinessDetails,
} from "@/components/auth/PartnerBusinessFields";

/**
 * ADR-046b — the single entry point for "Become a Service Provider," reachable from a Rider's
 * Dashboard/Settings/Profile at any point after signup. Renders a different view per
 * `PartnerVerificationStatus`, all driven by the same `GET /api/partner/application` read;
 * the editable states reuse `PartnerBusinessFields` (the exact form signup/onboarding/settings
 * already use) rather than a parallel form.
 */
export default function BecomeProviderPage() {
  const router = useRouter();
  const [application, setApplication] = useState<PartnerApplicationDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<PartnerBusinessDetails>(emptyPartnerBusinessDetails);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/partner/application");
    const data: PartnerApplicationDTO = await res.json();
    setApplication(data);
    if (data.profile) {
      setDetails({
        businessName: data.profile.businessName,
        type: data.profile.type,
        city: data.profile.city,
        description: data.profile.description ?? "",
        contactPerson1Name: data.profile.contactPerson1Name ?? "",
        contactPerson1Mobile: data.profile.contactPerson1Mobile ?? "",
        contactPerson2Name: data.profile.contactPerson2Name ?? "",
        contactPerson2Mobile: data.profile.contactPerson2Mobile ?? "",
        addressLine: data.profile.addressLine ?? "",
        area: data.profile.area ?? "",
        pincode: data.profile.pincode ?? "",
        latitude: data.profile.latitude,
        longitude: data.profile.longitude,
        governmentIdType: data.profile.governmentIdType ?? "",
        governmentIdNumber: data.profile.governmentIdNumber ?? "",
        workingHours: data.profile.workingHours ?? "",
        serviceRadiusKm: data.profile.serviceRadiusKm != null ? String(data.profile.serviceRadiusKm) : "",
        yearsOfExperience: data.profile.yearsOfExperience != null ? String(data.profile.yearsOfExperience) : "",
        businessMobile: data.profile.businessMobile ?? "",
        businessEmail: data.profile.businessEmail ?? "",
      });
    }
    setLoading(false);
    // FINAL PRODUCT MODEL — capability is active the moment a profile exists (ADR-049): any
    // non-SUSPENDED status (DRAFT/PENDING_VERIFICATION/MORE_INFORMATION_REQUIRED/REJECTED/
    // APPROVED) can operate the provider platform, so land capable users on the provider
    // dashboard. Only a never-started (NOT_APPLIED) or admin-suspended (SUSPENDED) account
    // stays on this page.
    if (data.status !== "NOT_APPLIED" && data.status !== "SUSPENDED") {
      router.replace("/partner");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = partnerProfileSchema.safeParse({
      businessName: details.businessName,
      type: details.type,
      city: details.city,
      description: details.description.trim() || undefined,
      contactPerson1Name: details.contactPerson1Name.trim() || undefined,
      contactPerson1Mobile: details.contactPerson1Mobile.trim() || undefined,
      contactPerson2Name: details.contactPerson2Name.trim() || undefined,
      contactPerson2Mobile: details.contactPerson2Mobile.trim() || undefined,
      addressLine: details.addressLine.trim() || undefined,
      area: details.area.trim() || undefined,
      pincode: details.pincode.trim() || undefined,
      latitude: details.latitude ?? undefined,
      longitude: details.longitude ?? undefined,
      governmentIdType: details.governmentIdType || undefined,
      governmentIdNumber: details.governmentIdNumber.trim() || undefined,
      workingHours: details.workingHours.trim() || undefined,
      serviceRadiusKm: details.serviceRadiusKm.trim() || undefined,
      yearsOfExperience: details.yearsOfExperience.trim() || undefined,
      businessMobile: details.businessMobile.trim(),
      businessEmail: details.businessEmail.trim(),
    });
    if (!parsed.success) {
      setError(formatZodError(parsed.error).join(" "));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/partner/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(typeof data.error === "string" ? data.error : "Could not save your application.");
      }
      await load();
      setStarted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/partner/application/submit", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { message?: string });
        throw new Error(data.message ?? "Could not submit your application.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReapply() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/partner/application/reapply", { method: "POST" });
      if (!res.ok) throw new Error("Could not restart your application.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !application) {
    return <div className="py-10 text-center text-foreground/50">Loading…</div>;
  }

  const status = application.status;
  const showForm = status === "NOT_APPLIED" ? started : status === "DRAFT" || status === "MORE_INFORMATION_REQUIRED";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Become a Service Provider</h1>
      <p className="mt-2 text-sm text-foreground/60">
        List your bikes, offer roadside assistance, and grow your business with BIKIE — without
        losing anything about your Rider account.
      </p>

      <div className="mt-8 space-y-6">
        {status === "NOT_APPLIED" && !started && (
          <div className="rounded-3xl bg-card p-6">
            <p className="font-semibold">Tell us about your business</p>
            <p className="mt-2 text-sm text-foreground/60">
              Complete a short Service Provider profile and you can start operating right away —
              no admin approval needed. Verification is an optional trust step you can request
              anytime to earn the ✓ BIKIE Verified badge. You'll keep full Rider access the whole
              time.
            </p>
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="mt-4 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Create my Service Provider profile
            </button>
          </div>
        )}

        {status === "MORE_INFORMATION_REQUIRED" && application.profile?.reviewNote && (
          <div className="rounded-2xl bg-[#ffaa00]/10 px-4 py-3 text-sm text-[#ffaa00]">
            <p className="font-semibold">More information needed</p>
            <p className="mt-1">{application.profile.reviewNote}</p>
          </div>
        )}

        {status === "PENDING_VERIFICATION" && (
          <div className="rounded-3xl bg-card p-6">
            <p className="font-semibold">Verification requested — you can operate now</p>
            <p className="mt-2 text-sm text-foreground/60">
              Your Service Provider profile is already live. You're not blocked while an admin
              reviews your optional verification.
              {application.profile?.submittedAt &&
                ` Submitted ${new Date(application.profile.submittedAt).toLocaleDateString()}.`}
            </p>
          </div>
        )}

        {status === "REJECTED" && (
          <div className="rounded-3xl bg-card p-6">
            <p className="font-semibold text-red-400">Verification not approved</p>
            {application.profile?.rejectionReason && (
              <p className="mt-2 text-sm text-foreground/60">{application.profile.rejectionReason}</p>
            )}
            <p className="mt-2 text-sm text-foreground/60">
              Your profile stays active — you can keep operating as an unverified Service Provider.
            </p>
            <button
              type="button"
              onClick={handleReapply}
              disabled={saving}
              className="mt-4 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? "Please wait…" : "Re-apply for verification"}
            </button>
          </div>
        )}

        {status === "SUSPENDED" && (
          <div className="rounded-3xl bg-card p-6">
            <p className="font-semibold text-red-400">Service Provider account suspended</p>
            {application.profile?.reviewNote && (
              <p className="mt-2 text-sm text-foreground/60">{application.profile.reviewNote}</p>
            )}
            <p className="mt-2 text-sm text-foreground/60">Contact support to appeal this decision.</p>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSaveDraft} className="space-y-6 rounded-3xl bg-card p-6">
            <PartnerBusinessFields value={details} onChange={setDetails} idPrefix="become-provider" showDescription />

            {error && <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-foreground/10 px-6 py-2.5 text-sm font-semibold hover:bg-foreground/15 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save draft"}
              </button>
              {(status === "DRAFT" || status === "MORE_INFORMATION_REQUIRED") && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {saving ? "Please wait…" : "Submit for verification"}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
