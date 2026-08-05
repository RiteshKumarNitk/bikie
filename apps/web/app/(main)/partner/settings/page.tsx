import type { Metadata } from "next";
import type { PartnerProfileDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { PartnerSettingsForm } from "@/components/dashboard/PartnerSettingsForm";

export const metadata: Metadata = { title: "Partner Settings" };

export default async function PartnerSettingsPage() {
  const { profile } = await getJson<{ profile: PartnerProfileDTO | null }>("/api/partner/profile", { auth: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section className="mt-6 rounded-3xl bg-card p-6">
        <p className="font-semibold">Business Profile</p>
        <div className="mt-4">
          <PartnerSettingsForm profile={profile} />
        </div>
      </section>
    </div>
  );
}
