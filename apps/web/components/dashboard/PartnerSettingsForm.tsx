"use client";

import { useState } from "react";
import type { PartnerProfileDTO } from "@bikie/types";
import { partnerProfileSchema } from "@bikie/validation";
import { formatZodError } from "@/lib/format-zod-error";
import {
  PartnerBusinessFields,
  type PartnerBusinessDetails,
} from "@/components/auth/PartnerBusinessFields";

/** Mirrors RiderDetailsSettings.tsx's pattern — a client form owning its own state/save call,
 * rendered from the server component that fetched the initial profile. Replaces what used to be
 * a read-only stub ("Profile editing is coming soon") — this is the only place a partner can fix
 * their shop location or government ID once set wrong at onboarding, same as riders revisiting
 * `/onboarding` from their own Settings. */
export function PartnerSettingsForm({ profile }: { profile: PartnerProfileDTO | null }) {
  const [details, setDetails] = useState<PartnerBusinessDetails>({
    businessName: profile?.businessName ?? "",
    type: profile?.type ?? "RENTAL",
    city: profile?.city ?? "",
    businessMobile: profile?.businessMobile ?? "",
    businessEmail: profile?.businessEmail ?? "",
    description: profile?.description ?? "",
    contactPerson1Name: profile?.contactPerson1Name ?? "",
    contactPerson1Mobile: profile?.contactPerson1Mobile ?? "",
    contactPerson2Name: profile?.contactPerson2Name ?? "",
    contactPerson2Mobile: profile?.contactPerson2Mobile ?? "",
    addressLine: profile?.addressLine ?? "",
    area: profile?.area ?? "",
    pincode: profile?.pincode ?? "",
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
    governmentIdType: profile?.governmentIdType ?? "",
    governmentIdNumber: profile?.governmentIdNumber ?? "",
    workingHours: profile?.workingHours ?? "",
    serviceRadiusKm: profile?.serviceRadiusKm != null ? String(profile.serviceRadiusKm) : "",
    yearsOfExperience: profile?.yearsOfExperience != null ? String(profile.yearsOfExperience) : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const body = {
      businessName: details.businessName,
      type: details.type,
      city: details.city,
      businessMobile: details.businessMobile,
      businessEmail: details.businessEmail,
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
    };

    const parsed = partnerProfileSchema.safeParse(body);
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
        throw new Error(data.error ?? "Failed to save partner profile");
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving your details. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PartnerBusinessFields value={details} onChange={setDetails} idPrefix="settings-partner" />

      {profile && (
        <p className="text-xs text-foreground/50">
          Verification status: {profile.isVerified ? "Verified" : "Pending"}
        </p>
      )}

      {error && <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      {saved && !error && (
        <div className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">Saved.</div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
