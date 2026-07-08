"use client";

import { useState, useEffect } from "react";

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

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/partners")
      .then((r) => r.json())
      .then((data) => { setPartners(data.partners); setLoading(false); });
  }, []);

  async function handleToggleVerify(id: string, current: boolean) {
    await fetch(`/api/admin/partners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: !current }),
    });
    setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, isVerified: !current } : p)));
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/partners/${id}`, { method: "DELETE" });
    setDeletingId(null);
    setPartners((prev) => prev.filter((p) => p.id !== id));
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
            <div className="min-w-0 flex-1">
              <p className="font-medium">{partner.businessName}</p>
              <p className="text-sm text-foreground/50">
                {partner.type.replace(/_/g, " ")} · {partner.city} · {partner.owner.email}
              </p>
              <p className="mt-1 text-xs text-foreground/40">
                Owner: {partner.owner.name}
                {partner.ratingCount > 0 && ` · ★ ${partner.ratingAvg.toFixed(1)} (${partner.ratingCount})`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggleVerify(partner.id, partner.isVerified)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  partner.isVerified
                    ? "bg-success/15 text-success hover:bg-success/25"
                    : "bg-warning/15 text-warning hover:bg-warning/25"
                }`}
              >
                {partner.isVerified ? "Verified" : "Pending"}
              </button>
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