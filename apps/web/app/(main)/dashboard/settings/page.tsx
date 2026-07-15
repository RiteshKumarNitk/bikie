import type { Metadata } from "next";
import type { RiderProfileDTO } from "@bikie/types";
import { getServerSession } from "@/lib/get-session";
import { getJson } from "@/lib/api";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";
import { RiderDetailsSettings } from "@/components/dashboard/RiderDetailsSettings";
import { BecomeServiceProviderAction } from "@/components/dashboard/BecomeServiceProviderAction";

export const metadata: Metadata = { title: "Settings" };

export default async function DashboardSettingsPage() {
  const session = await getServerSession();
  const { profile } = await getJson<{ profile: RiderProfileDTO | null; needsOnboarding: boolean }>(
    "/api/rider-profile",
    { auth: true },
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>

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

      {session?.user.role === "RENTER" && (
        <section className="mt-6 rounded-3xl bg-card p-6">
          <p className="font-semibold">Become a Service Provider</p>
          <p className="mt-2 text-sm text-foreground/60">
            List your bikes, offer services, or organize rides as a partner. You&apos;ll need to
            re-verify your phone number and add a few business details.
          </p>
          <div className="mt-4">
            <BecomeServiceProviderAction />
          </div>
        </section>
      )}
    </div>
  );
}