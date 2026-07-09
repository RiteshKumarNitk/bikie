import type { Metadata } from "next";
import { getJson } from "@/lib/api";
import { MembershipPlansManager } from "@/components/admin/MembershipPlansManager";

export const metadata: Metadata = { title: "Membership Plans" };

export default async function AdminMembershipPage() {
  const { plans } = await getJson<{ plans: any[] }>("/api/admin/membership/plans", { auth: true });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Membership Plans</h1>
      <p className="mt-1 text-sm text-white/50">Create and manage the membership tiers offered to riders.</p>
      <MembershipPlansManager initial={plans} />
    </div>
  );
}
