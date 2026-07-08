import type { Metadata } from "next";
import type { PartnerProfileDTO } from "@bikie/types";
import { getJson } from "@/lib/api";

export const metadata: Metadata = { title: "Partner Settings" };

export default async function PartnerSettingsPage() {
  const { profile } = await getJson<{ profile: PartnerProfileDTO | null }>("/api/partner/profile", { auth: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section className="mt-6 rounded-3xl bg-card p-6">
        <p className="font-semibold">Business Profile</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-foreground/50">Business Name</label>
            <input readOnly value={profile?.businessName ?? ""} className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-foreground/50">Partner Type</label>
            <input readOnly value={profile?.type ?? ""} className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-foreground/50">City</label>
            <input readOnly value={profile?.city ?? ""} className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-foreground/50">Verification Status</label>
            <input readOnly value={profile?.isVerified ? "Verified" : "Pending"} className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm" />
          </div>
        </div>
        <p className="mt-3 text-xs text-foreground/50">Profile editing is coming soon.</p>
      </section>
    </div>
  );
}
