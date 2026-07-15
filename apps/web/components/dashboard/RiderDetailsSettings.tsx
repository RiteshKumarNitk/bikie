"use client";

import { useState } from "react";
import type { RiderProfileDTO } from "@bikie/types";
import { riderProfileSchema } from "@bikie/validation";
import { formatZodError } from "@/lib/format-zod-error";
import {
  EmergencyContactsEditor,
  type EmergencyContactValue,
} from "@/components/shared/EmergencyContactsEditor";
import {
  RiderProfileExtraFields,
  emptyRiderProfileExtraValue,
  type RiderProfileExtraValue,
} from "@/components/shared/RiderProfileExtraFields";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30";
const labelClassName = "text-sm font-medium";

function toDateInputValue(isoDatetime: string | null): string {
  return isoDatetime ? isoDatetime.slice(0, 10) : "";
}

export function RiderDetailsSettings({ profile }: { profile: RiderProfileDTO | null }) {
  const [drivingLicenceNumber, setDrivingLicenceNumber] = useState(
    profile?.drivingLicenceNumber ?? "",
  );
  const [drivingLicenceExpiry, setDrivingLicenceExpiry] = useState(
    toDateInputValue(profile?.drivingLicenceExpiry ?? null),
  );
  const [addressLine, setAddressLine] = useState(profile?.addressLine ?? "");
  const [area, setArea] = useState(profile?.area ?? "");
  const [district, setDistrict] = useState(profile?.district ?? "");
  const [pincode, setPincode] = useState(profile?.pincode ?? "");
  const [country, setCountry] = useState(profile?.country ?? "India");
  const [contacts, setContacts] = useState<EmergencyContactValue[]>(
    profile?.emergencyContacts.map((contact) => ({
      name: contact.name,
      phone: contact.phone,
      relation: contact.relation ?? "",
    })) ?? [],
  );
  const [extra, setExtra] = useState<RiderProfileExtraValue>({
    ...emptyRiderProfileExtraValue,
    fatherName: profile?.fatherName ?? "",
    motherName: profile?.motherName ?? "",
    dateOfBirth: toDateInputValue(profile?.dateOfBirth ?? null),
    gender: profile?.gender ?? "",
    bloodGroup: profile?.bloodGroup ?? "",
    medicalHistory: profile?.medicalHistory ?? "",
    allergies: profile?.allergies ?? "",
    vehicleType: profile?.vehicleType ?? "",
    vehicleBrand: profile?.vehicleBrand ?? "",
    vehicleModel: profile?.vehicleModel ?? "",
    governmentIdType: profile?.governmentIdType ?? "",
    governmentIdNumber: profile?.governmentIdNumber ?? "",
    riderFrequency: profile?.riderFrequency ?? "",
    ridingClubType: profile?.ridingClubType ?? "",
    clubName: profile?.clubName ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const body = {
      drivingLicenceNumber: drivingLicenceNumber.trim() || undefined,
      drivingLicenceExpiry: drivingLicenceExpiry
        ? new Date(drivingLicenceExpiry).toISOString()
        : undefined,
      addressLine: addressLine.trim() || undefined,
      area: area.trim() || undefined,
      district: district.trim() || undefined,
      pincode: pincode.trim() || undefined,
      country: country.trim() || undefined,
      fatherName: extra.fatherName.trim() || undefined,
      motherName: extra.motherName.trim() || undefined,
      dateOfBirth: extra.dateOfBirth ? new Date(extra.dateOfBirth).toISOString() : undefined,
      gender: extra.gender || undefined,
      bloodGroup: extra.bloodGroup || undefined,
      medicalHistory: extra.medicalHistory.trim() || undefined,
      allergies: extra.allergies.trim() || undefined,
      vehicleType: extra.vehicleType || undefined,
      vehicleBrand: extra.vehicleBrand.trim() || undefined,
      vehicleModel: extra.vehicleModel.trim() || undefined,
      governmentIdType: (extra.governmentIdType || undefined) as "AADHAAR" | "PASSPORT" | undefined,
      governmentIdNumber: extra.governmentIdNumber.trim() || undefined,
      riderFrequency: (extra.riderFrequency || undefined) as
        | "OCCASIONAL"
        | "WEEKLY"
        | "DAILY"
        | undefined,
      ridingClubType: (extra.ridingClubType || undefined) as "SOLO" | "CLUB_MEMBER" | undefined,
      clubName: extra.ridingClubType === "CLUB_MEMBER" ? extra.clubName.trim() || undefined : undefined,
      emergencyContacts: contacts
        .filter((contact) => contact.name.trim() && contact.phone.trim())
        .map((contact) => ({
          name: contact.name.trim(),
          phone: contact.phone.trim(),
          relation: contact.relation.trim() || undefined,
        })),
    };

    const parsed = riderProfileSchema.safeParse(body);
    if (!parsed.success) {
      setError(formatZodError(parsed.error).join(" "));
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/rider-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error("Failed to save rider profile");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Something went wrong saving your details. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName} htmlFor="settings-licence-number">
            Driving licence number
          </label>
          <input
            id="settings-licence-number"
            value={drivingLicenceNumber}
            onChange={(e) => setDrivingLicenceNumber(e.target.value)}
            placeholder="e.g. KA0120230012345"
            className={inputClassName}
          />
        </div>
        <div>
          <label className={labelClassName} htmlFor="settings-licence-expiry">
            Licence expiry date
          </label>
          <input
            id="settings-licence-expiry"
            type="date"
            value={drivingLicenceExpiry}
            onChange={(e) => setDrivingLicenceExpiry(e.target.value)}
            className={inputClassName}
          />
        </div>
      </div>

      <RiderProfileExtraFields
        value={extra}
        onChange={setExtra}
        idPrefix="settings-"
        sectionHeadingClassName="text-xs font-semibold uppercase tracking-wider text-foreground/50"
      />

      <div className="border-t border-foreground/10 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
          Address
        </p>
        <div className="mt-3">
          <label className={labelClassName} htmlFor="settings-address-line">
            Address line
          </label>
          <input
            id="settings-address-line"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            placeholder="House / street"
            className={inputClassName}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="settings-area">
              Area
            </label>
            <input
              id="settings-area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor="settings-district">
              District
            </label>
            <input
              id="settings-district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor="settings-pincode">
              Pincode
            </label>
            <input
              id="settings-pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor="settings-country">
              Country
            </label>
            <input
              id="settings-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={inputClassName}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-foreground/10 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
          Emergency contacts
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          Up to 3 people we can reach in case of an emergency during a ride.
        </p>
        <div className="mt-3">
          <EmergencyContactsEditor contacts={contacts} onChange={setContacts} max={3} />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="flex justify-end border-t border-foreground/10 pt-6">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save Rider Details"}
        </button>
      </div>
    </form>
  );
}
