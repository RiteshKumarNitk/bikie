"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AdminPartnerRowDTO, AdminPartnerStatsDTO } from "@bikie/types";
import { useToast } from "@/components/ui/Toast";

const STAT_CARDS: { key: keyof AdminPartnerStatsDTO; label: string; tone?: string }[] = [
  { key: "total", label: "Total Providers" },
  { key: "active", label: "Active" },
  { key: "unverified", label: "Unverified" },
  { key: "pendingVerification", label: "Verification Pending", tone: "text-warning" },
  { key: "verified", label: "Verified", tone: "text-success" },
  { key: "moreInfoRequired", label: "Info Requested" },
  { key: "rejected", label: "Rejected", tone: "text-red-400" },
  { key: "suspended", label: "Suspended", tone: "text-red-400" },
  { key: "reported", label: "Reported", tone: "text-red-400" },
];

const STATUS_STYLES: Record<string, string> = {
  APPROVED: "bg-success/15 text-success",
  PENDING_VERIFICATION: "bg-warning/15 text-warning",
  MORE_INFORMATION_REQUIRED: "bg-warning/15 text-warning",
  DRAFT: "bg-foreground/10 text-foreground/60",
  REJECTED: "bg-red-500/15 text-red-400",
  SUSPENDED: "bg-red-500/15 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  APPROVED: "Approved",
  PENDING_VERIFICATION: "Pending verification",
  MORE_INFORMATION_REQUIRED: "Info requested",
  DRAFT: "Draft",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<AdminPartnerRowDTO[]>([]);
  const [stats, setStats] = useState<AdminPartnerStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetch("/api/admin/partners")
      .then((r) => r.json())
      .then((data) => { setPartners(data.partners); setStats(data.stats); setLoading(false); });
  }, []);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/partners/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      toast.error("Unable to delete this provider. Please try again.");
      return;
    }
    setPartners((prev) => prev.filter((p) => p.id !== id));
    toast.success("Provider deleted successfully");
  }

  const filtered = partners.filter(
    (p) =>
      p.businessName.toLowerCase().includes(search.toLowerCase()) ||
      p.owner.email.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return <div className="h-48 animate-pulse rounded-3xl bg-card" />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Partners ({partners.length})</h1>
      </div>

      {stats && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STAT_CARDS.map(({ key, label, tone }) => (
            <div key={key} className="rounded-2xl border border-foreground/10 bg-card p-4">
              <p className={`text-2xl font-semibold ${tone ?? ""}`}>{stats[key]}</p>
              <p className="mt-0.5 text-xs text-foreground/50">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <input
          type="text"
          placeholder="Search by business, email, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
        />
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((partner) => (
          <div key={partner.id} className="flex items-center justify-between rounded-2xl border border-foreground/10 bg-card p-5">
            <Link href={`/admin/partners/${partner.id}`} className="min-w-0 flex-1">
              <p className="font-medium hover:underline">{partner.businessName}</p>
              <p className="text-sm text-foreground/50">
                {partner.type.replace(/_/g, " ")} · {partner.city} · {partner.owner.email}
              </p>
              <p className="mt-1 text-xs text-foreground/40">
                Owner: {partner.owner.name}
                {partner.ratingCount > 0 && ` · ★ ${partner.ratingAvg.toFixed(1)} (${partner.ratingCount})`}
              </p>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/partners/${partner.id}`}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${STATUS_STYLES[partner.verificationStatus] ?? "bg-foreground/10"}`}
              >
                {STATUS_LABELS[partner.verificationStatus] ?? partner.verificationStatus}
              </Link>
              <button
                type="button"
                onClick={() => setDeletingId(partner.id)}
                className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-foreground/10 bg-card p-8 text-center text-sm text-foreground/50">
            No partners found
          </div>
        )}
      </div>

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeletingId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Delete Partner?</h3>
            <p className="mt-2 text-sm text-foreground/50">This will permanently remove this partner and their associated data.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setDeletingId(null)} className="flex-1 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5">Cancel</button>
              <button type="button" onClick={() => handleDelete(deletingId)} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
