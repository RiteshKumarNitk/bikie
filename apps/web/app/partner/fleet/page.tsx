"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@bikie/utils";

interface Bike {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: { name: string };
  city: string;
  pricePerDay: number;
  imageUrl: string;
  ratingAvg: number;
}

interface Category {
  id: string;
  name: string;
}

export default function PartnerFleetPage() {
  const router = useRouter();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: "", brand: "", slug: "", categoryId: "", city: "",
    pricePerDay: "", imageUrl: "", description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/partner/bikes").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([bikesData, catsData]) => {
      setBikes(bikesData.bikes);
      setCategories(catsData.categories ?? []);
      setLoading(false);
    });
  }, []);

  async function handleAdd() {
    setSubmitting(true);
    const res = await fetch("/api/admin/bikes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        pricePerDay: Number(form.pricePerDay),
        ownerId: (await fetch("/api/auth/get-session").then((r) => r.json())).user?.id,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setShowAdd(false);
      setForm({ name: "", brand: "", slug: "", categoryId: "", city: "", pricePerDay: "", imageUrl: "", description: "" });
      const data = await res.json();
      setBikes((prev) => [...prev, data.bike]);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/bikes/${id}`, { method: "DELETE" });
    setDeletingId(null);
    setBikes((prev) => prev.filter((b) => b.id !== id));
  }

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-card" />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Fleet ({bikes.length})</h1>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="rounded-xl bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          + Add Bike
        </button>
      </div>

      {bikes.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-foreground/10 bg-card p-12 text-center">
          <p className="text-3xl">🏍️</p>
          <p className="mt-3 font-medium">No bikes listed yet</p>
          <p className="mt-1 text-sm text-foreground/50">Add your first bike to start receiving bookings.</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="mt-4 rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-white"
          >
            Add Your First Bike
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bikes.map((bike) => (
            <div key={bike.id} className="group relative rounded-2xl border border-foreground/10 bg-card overflow-hidden">
              <div className="aspect-[4/3] bg-foreground/5" />
              <div className="p-4">
                <p className="font-medium">{bike.name}</p>
                <p className="text-sm text-foreground/50">{bike.brand} · {bike.category.name}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="font-semibold text-accent">{formatCurrency(bike.pricePerDay)}<span className="text-xs text-foreground/50">/day</span></p>
                  <button
                    type="button"
                    onClick={() => setDeletingId(bike.id)}
                    className="rounded-lg border border-red-500/20 px-3 py-1 text-xs font-medium text-red-400 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 overflow-y-auto py-10" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Add Bike to Fleet</h3>
            <p className="mt-1 text-sm text-foreground/50">List your bike for rental on the platform.</p>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">Bike Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="e.g. Royal Enfield Meteor" className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-xs font-medium">Brand</label>
                  <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Royal Enfield" className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Category</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id} className="bg-card">{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">City</label>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Goa" className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-xs font-medium">Price per day (₹)</label>
                  <input type="number" value={form.pricePerDay} onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })} placeholder="e.g. 1500" className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Image URL</label>
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-xs font-medium">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5">Cancel</button>
              <button type="button" onClick={handleAdd} disabled={submitting || !form.name || !form.brand || !form.categoryId || !form.city || !form.pricePerDay} className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50">{submitting ? "Adding..." : "Add Bike"}</button>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeletingId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Remove Bike?</h3>
            <p className="mt-2 text-sm text-foreground/50">This will remove this bike from your fleet.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setDeletingId(null)} className="flex-1 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium">Cancel</button>
              <button type="button" onClick={() => handleDelete(deletingId)} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}