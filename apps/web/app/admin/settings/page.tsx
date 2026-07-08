import type { Metadata } from "next";
import { getServerSession } from "@/lib/get-session";

export const metadata: Metadata = { title: "Admin Settings" };

export default async function AdminSettingsPage() {
  const session = await getServerSession();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section className="mt-6 rounded-3xl bg-card p-6">
        <p className="font-semibold">Admin Account</p>
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
      </section>
      <p className="mt-6 text-sm text-foreground/50">CMS and blog management tools are planned for a future release.</p>
    </div>
  );
}
