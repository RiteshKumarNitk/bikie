import type { Metadata } from "next";
import { getJson } from "@/lib/api";

export const metadata: Metadata = { title: "Partners" };

interface AdminPartner {
  id: string;
  businessName: string;
  type: string;
  city: string;
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  owner: { name: string; email: string };
}

export default async function AdminPartnersPage() {
  const { partners } = await getJson<{ partners: AdminPartner[] }>("/api/admin/partners", { auth: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Partners ({partners.length})</h1>
      <div className="mt-6 space-y-4">
        {partners.map((partner) => (
          <div key={partner.id} className="flex items-center justify-between rounded-3xl bg-card p-5">
            <div>
              <p className="font-medium">{partner.businessName}</p>
              <p className="text-sm text-foreground/60">
                {partner.type} · {partner.city} · {partner.owner.email}
              </p>
            </div>
            <div className="text-right">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${partner.isVerified ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>
                {partner.isVerified ? "Verified" : "Pending"}
              </span>
              <p className="mt-1 text-xs text-foreground/50">
                {partner.ratingCount > 0 ? `★ ${partner.ratingAvg.toFixed(1)}` : "No ratings"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
