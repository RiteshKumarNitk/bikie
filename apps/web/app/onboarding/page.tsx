"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function OnboardingPage() {
  const router = useRouter();

  const [drivingLicenceNumber, setDrivingLicenceNumber] = useState("");
  const [drivingLicenceExpiry, setDrivingLicenceExpiry] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [area, setArea] = useState("");
  const [district, setDistrict] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [contacts, setContacts] = useState<EmergencyContactValue[]>([]);
  const [extra, setExtra] = useState<RiderProfileExtraValue>(emptyRiderProfileExtraValue);

  const [saving, setSaving] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSkip() {
    setSkipping(true);
    setError(null);
    try {
      const res = await fetch("/api/rider-profile/skip", { method: "POST" });
      if (!res.ok) throw new Error("Failed to skip onboarding");
      router.push("/");
    } catch {
      setError("Something went wrong skipping onboarding. Please try again.");
      setSkipping(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/rider-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error("Failed to save rider profile");
      router.push("/");
    } catch {
      setError("Something went wrong saving your details. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || skipping;

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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-base font-bold text-white">
              B
            </div>
            <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
              BIKIE
            </span>
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-foreground md:text-4xl">
            Let&apos;s get you ready to ride
          </h1>
          <p className="mt-3 max-w-md text-base text-foreground/70">
            A few details help partners and fellow riders reach you faster. Everything here is
            optional — you can always fill it in later from Settings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass mt-10 space-y-8 rounded-3xl p-6 md:p-8 lg:p-10">
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">
              Driving licence
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClassName} htmlFor="drivingLicenceNumber">
                  Licence number
                </label>
                <input
                  id="drivingLicenceNumber"
                  value={drivingLicenceNumber}
                  onChange={(e) => setDrivingLicenceNumber(e.target.value)}
                  placeholder="e.g. KA0120230012345"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName} htmlFor="drivingLicenceExpiry">
                  Expiry date
                </label>
                <input
                  id="drivingLicenceExpiry"
                  type="date"
                  value={drivingLicenceExpiry}
                  onChange={(e) => setDrivingLicenceExpiry(e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>
          </section>

          <RiderProfileExtraFields value={extra} onChange={setExtra} />

          <section className="space-y-4 border-t border-foreground/10 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">
              Address
            </p>
            <div>
              <label className={labelClassName} htmlFor="addressLine">
                Address line
              </label>
              <input
                id="addressLine"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="House / street"
                className={inputClassName}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={labelClassName} htmlFor="area">
                  Area
                </label>
                <input
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName} htmlFor="district">
                  District
                </label>
                <input
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName} htmlFor="pincode">
                  Pincode
                </label>
                <input
                  id="pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName} htmlFor="country">
                  Country
                </label>
                <input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-foreground/10 pt-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">
                Emergency contacts
              </p>
              <p className="mt-1 text-sm text-foreground/60">
                Add up to 3 people we can reach in case of an emergency during a ride.
              </p>
            </div>
            <EmergencyContactsEditor contacts={contacts} onChange={setContacts} max={3} />
          </section>

          {error && (
            <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <div className="flex flex-col-reverse items-center gap-4 border-t border-foreground/10 pt-6 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handleSkip}
              disabled={busy}
              className="text-sm font-medium text-foreground/60 hover:text-foreground disabled:opacity-50"
            >
              {skipping ? "Skipping…" : "Skip for now"}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-colors hover:bg-accent-hover disabled:opacity-50 sm:w-auto"
            >
              {saving ? "Saving…" : "Save & continue"}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-foreground/60">
          Changed your mind? You can always update this later from{" "}
          <Link href="/dashboard/settings" className="font-medium text-accent-text hover:underline">
            Settings
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
