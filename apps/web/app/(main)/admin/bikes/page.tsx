"use client";

import { useState, useEffect } from "react";

interface AdminBike {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: { name: string };
  city: string;
  pricePerDay: number;
  ratingAvg: number;
  imageUrl: string;
}

export default function AdminBikesPage() {
  const [bikes, setBikes] = useState<AdminBike[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bikes?pageSize=100")
      .then((r) => r.json())
      .then((data) => { setBikes(data.bikes); setTotal(data.total); setLoading(false); });
  }, []);

  async function handleDelete(id: string) {
    await fetch(`/api/admin/bikes/${id}`, { method: "DELETE" });
    setDeletingId(null);
    setBikes((prev) => prev.filter((b) => b.id !== id));
    setTotal((prev) => prev - 1);
  }

  const filtered = bikes.filter(
    (b) => b.name.toLowerCase().includes(search.toLowerCase()) || b.brand.toLowerCase().includes(search.toLowerCase()) || b.city.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return <div className="h-48 animate-pulse rounded-3xl bg-card" />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bikes ({total})</h1>
      </div>

      <div className="mt-4">
        <input
          type="text"
          placeholder="Search by name, brand, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-foreground/10 bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-foreground/50">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Brand</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">City</th>
              <th className="px-5 py-3 font-medium">Price/day</th>
              <th className="px-5 py-3 font-medium">Rating</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((bike) => (
              <tr key={bike.id} className="border-b border-foreground/5 last:border-0">
                <td className="px-5 py-3 font-medium">{bike.name}</td>
                <td className="px-5 py-3 text-foreground/60">{bike.brand}</td>
                <td className="px-5 py-3 text-foreground/60">{bike.category.name}</td>
                <td className="px-5 py-3 text-foreground/60">{bike.city}</td>
                <td className="px-5 py-3">₹{bike.pricePerDay}</td>
                <td className="px-5 py-3">★ {bike.ratingAvg.toFixed(1)}</td>
                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => setDeletingId(bike.id)}
                    className="rounded-lg border border-red-500/20 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-foreground/50">No bikes found</div>
        )}
      </div>

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeletingId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Delete Bike?</h3>
            <p className="mt-2 text-sm text-foreground/50">This will permanently remove this bike listing and all associated bookings.</p>
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