import type { Metadata } from "next";
import Link from "next/link";
import type { PartnerProfileDTO } from "@bikie/types";
import { getJsonOrFallback } from "@/lib/api";
import { PartnerSettingsForm } from "@/components/dashboard/PartnerSettingsForm";
import { PushNotificationToggle } from "@/components/dashboard/PushNotificationToggle";

export const metadata: Metadata = { title: "Partner Settings" };

export default async function PartnerSettingsPage() {
  // `null` = "no business profile yet", which is exactly what this form renders as an empty
  // create-form — the same state a Service Provider who hasn't finished onboarding is really in.
  const { profile } = await getJsonOrFallback<{ profile: PartnerProfileDTO | null }>(
    "/api/partner/profile",
    { profile: null },
    { auth: true },
  );

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
        <p className="font-semibold">Notifications</p>
        <p className="mt-2 text-sm text-foreground/60">
          This is what SOS assistance requests and other alerts on the web use to reach you — with
          this off, they only reach you by SMS/email, never in-browser.
        </p>
        <div className="mt-4">
          <PushNotificationToggle />
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
