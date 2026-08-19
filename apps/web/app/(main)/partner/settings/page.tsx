import type { Metadata } from "next";
import Link from "next/link";
import type { PartnerProfileDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { PartnerSettingsForm } from "@/components/dashboard/PartnerSettingsForm";

export const metadata: Metadata = { title: "Partner Settings" };

export default async function PartnerSettingsPage() {
  let profile: PartnerProfileDTO | null = null;
  try {
    const res = await getJson<{ profile: PartnerProfileDTO | null }>("/api/partner/profile", { auth: true });
    profile = res.profile;
  } catch {
    // Fall back to null profile if fetch fails
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section className="mt-6 rounded-3xl bg-card p-6">
        <p className="font-semibold">Business Profile</p>
        <div className="mt-4">
          <PartnerSettingsForm profile={profile} />
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-card p-6">
        <p className="font-semibold">Customer Support</p>
        <p className="mt-2 text-sm text-foreground/60">
          Picked the wrong account type at signup, or need help with something else on your
          account? Raise a request and an admin will review it.
        </p>
        <Link
          href="/account-type-request"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-foreground/15 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5"
        >
          Request Account Type Change
        </Link>
      </section>
    </div>
  );
}
