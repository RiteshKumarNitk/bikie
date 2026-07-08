import type { Metadata } from "next";
import { getServerSession } from "@/lib/get-session";

export const metadata: Metadata = { title: "Settings" };

export default async function DashboardSettingsPage() {
  const session = await getServerSession();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="mt-6 rounded-3xl bg-card p-6">
        <p className="font-semibold">Profile</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-foreground/50">Name</label>
            <input readOnly value={session?.user.name ?? ""} className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-foreground/50">Email</label>
            <input readOnly value={session?.user.email ?? ""} className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm" />
          </div>
        </div>
        <p className="mt-3 text-xs text-foreground/50">Profile editing is coming soon.</p>
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
