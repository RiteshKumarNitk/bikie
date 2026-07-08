import type { Metadata } from "next";
import { getServerSession } from "@/lib/get-session";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";

export const metadata: Metadata = { title: "Settings" };

export default async function DashboardSettingsPage() {
  const session = await getServerSession();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="mt-6 rounded-3xl bg-card p-6">
        <p className="font-semibold">Profile</p>
        <ProfileSettings
          name={session?.user.name ?? ""}
          email={session?.user.email ?? ""}
          phone={(session?.user as any).phone ?? null}
        />
      </section>

      <section className="mt-6 rounded-3xl bg-card p-6">
        <p className="font-semibold">Documents</p>
        <p className="mt-2 text-sm text-foreground/60">Upload your driving license and ID for faster pickups.</p>
        <p className="mt-3 text-xs text-foreground/50">Document upload is coming soon.</p>
      </section>

      <section className="mt-6 rounded-3xl bg-card p-6">
        <p className="font-semibold">Emergency Contacts</p>
        <p className="mt-2 text-sm text-foreground/60">Add a contact we can reach in case of an emergency during a ride.</p>
        <p className="mt-3 text-xs text-foreground/50">Emergency contacts are coming soon.</p>
      </section>
    </div>
  );
}