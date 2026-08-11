import type { Metadata } from "next";
import Link from "next/link";
import type { RiderProfileDTO } from "@bikie/types";
import { getServerSession } from "@/lib/get-session";
import { getJson } from "@/lib/api";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";
import { RiderDetailsSettings } from "@/components/dashboard/RiderDetailsSettings";
import { PushNotificationToggle } from "@/components/dashboard/PushNotificationToggle";
import { RiderLocationToggle } from "@/components/dashboard/RiderLocationToggle";
import { ReceiveSosAlertsToggle } from "@/components/dashboard/ReceiveSosAlertsToggle";

export const metadata: Metadata = { title: "Profile" };

export default async function DashboardSettingsPage() {
  const session = await getServerSession();
  const { profile } = await getJson<{ profile: RiderProfileDTO | null; needsOnboarding: boolean }>(
    "/api/rider-profile",
    { auth: true },
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold">Profile</h1>

      <section className="mt-6 rounded-3xl bg-card p-6">
        <p className="font-semibold">Profile</p>
        <ProfileSettings
          name={session?.user.name ?? ""}
          email={session?.user.email ?? ""}
          image={session?.user.image ?? null}
          phone={(session?.user as any).phone ?? null}
        />
      </section>

      <section className="mt-6 rounded-3xl bg-card p-6">
        <p className="font-semibold">Notifications</p>
        <div className="mt-4">
          <PushNotificationToggle />
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-card p-6">
        <p className="font-semibold">Nearby riders</p>
        <div className="mt-4">
          <RiderLocationToggle />
        </div>
        <div className="mt-4 border-t border-foreground/10 pt-4">
          <ReceiveSosAlertsToggle />
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-card p-6">
        <p className="font-semibold">Documents</p>
        <p className="mt-2 text-sm text-foreground/60">Upload your driving license and ID for faster pickups.</p>
        <p className="mt-3 text-xs text-foreground/50">Document upload is coming soon.</p>
      </section>

      <section className="mt-6 rounded-3xl bg-card p-6">
        <p className="font-semibold">Rider Details</p>
        <p className="mt-2 text-sm text-foreground/60">
          Your driving licence, address, and emergency contacts — shown to partners and used if we
          ever need to reach someone on your behalf during a ride.
        </p>
        <div className="mt-4">
          <RiderDetailsSettings profile={profile} />
        </div>
      </section>

      {session?.user.partnerStatus == null && (
        <section className="mt-6 rounded-3xl bg-card p-6">
          <p className="font-semibold">Become a Service Provider</p>
          <p className="mt-2 text-sm text-foreground/60">
            Run a motorcycle service business — puncture shop, mechanic, repair centre, roadside
            assistance and more — and offer it through BIKIE. Create your Service Provider
            profile and start operating right away. No admin approval needed; getting verified is
            an optional trust step.
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/become-provider"
              className="inline-block rounded-xl border border-accent/30 bg-accent/[0.04] px-5 py-2.5 text-sm font-medium text-accent-text transition-colors hover:bg-accent/10"
            >
              Become a Service Provider
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}