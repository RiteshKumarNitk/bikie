"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@bikie/utils";
import { Skeleton } from "@bikie/ui";
import { EmptyState } from "@/components/shared/EmptyState";
import { MembershipRequiredNotice } from "@/components/partner/PartnerMembershipStatus";

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
    pricePerDay: "", imageUrl: "", gallery: [] as string[], description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // ADR-056 — `/api/partner/bikes` is capability-gated (`requirePartnerCapability`), which also
  // requires an active membership. A non-member reaching this page (accountType lets them in,
  // membership doesn't) previously got a 403 body with no `bikes` field, and `setBikes(undefined)`
  // crashed the page on the very next render (`bikes.length`). Tracked separately from `loading`
  // so the empty-fleet state and the locked state render distinct messaging.
  const [membershipRequired, setMembershipRequired] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/partner/bikes").then(async (r) => ({ ok: r.ok, status: r.status, data: await r.json() })),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([bikesRes, catsData]) => {
      if (bikesRes.ok) {
        setBikes(bikesRes.data.bikes ?? []);
      } else {
        setMembershipRequired(bikesRes.status === 403);
      }
      setCategories(catsData.categories ?? []);
      setLoading(false);
    });
  }, []);

  async function uploadFile(file: File): Promise<string | null> {
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      setUploadError("Couldn't upload that image. Please try again.");
      return null;
    }
    const { url } = await res.json();
    return url as string;
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const url = await uploadFile(file);
    if (url) setForm((f) => ({ ...f, imageUrl: url }));
    setUploadingCover(false);
    e.target.value = "";
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadingGallery(true);
    const urls = (await Promise.all(files.map(uploadFile))).filter((u): u is string => Boolean(u));
    setForm((f) => ({ ...f, gallery: [...f.gallery, ...urls].slice(0, 8) }));
    setUploadingGallery(false);
    e.target.value = "";
  }

  async function handleAdd() {
    setSubmitting(true);
    const res = await fetch("/api/partner/bikes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, pricePerDay: Number(form.pricePerDay) }),
    });
    setSubmitting(false);
    if (res.ok) {
      setShowAdd(false);
      setForm({ name: "", brand: "", slug: "", categoryId: "", city: "", pricePerDay: "", imageUrl: "", gallery: [], description: "" });
      const data = await res.json();
      setBikes((prev) => [...prev, data.bike]);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/partner/bikes/${id}`, { method: "DELETE" });
    setDeletingId(null);
    setBikes((prev) => prev.filter((b) => b.id !== id));
  }

  if (loading) return <Skeleton className="h-48 rounded-2xl" />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Fleet ({bikes.length})</h1>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          disabled={membershipRequired}
          className="rounded-xl bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          + Add Bike
        </button>
      </div>

      <MembershipRequiredNotice feature="Fleet management" />

      {membershipRequired ? null : bikes.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon="🏍️"
            title="No bikes listed yet"
            description="Add your first bike to start receiving bookings."
            action={
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-white"
              >
                Add Your First Bike
              </button>
            }
          />
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
                  <p className="font-semibold text-accent-text">{formatCurrency(bike.pricePerDay)}<span className="text-xs text-foreground/50">/day</span></p>
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
                <label className="text-xs font-medium">Cover photo</label>
                <div className="mt-1 flex items-center gap-3">
                  {form.imageUrl && (
                    <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-foreground/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.imageUrl} alt="Cover" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={uploadingCover}
                    className="block w-full text-xs text-foreground/60 file:mr-3 file:rounded-lg file:border-0 file:bg-foreground/10 file:px-3 file:py-2 file:text-xs file:font-medium hover:file:bg-foreground/20"
                  />
                </div>
                {uploadingCover && <p className="mt-1 text-xs text-foreground/50">Uploading…</p>}
              </div>
              <div>
                <label className="text-xs font-medium">Gallery photos <span className="font-normal text-foreground/40">(optional, up to 8)</span></label>
                {form.gallery.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {form.gallery.map((url, i) => (
                      <div key={url} className="relative h-14 w-20 overflow-hidden rounded-lg border border-foreground/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, gallery: f.gallery.filter((_, idx) => idx !== i) }))}
                          className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  disabled={uploadingGallery || form.gallery.length >= 8}
                  className="mt-2 block w-full text-xs text-foreground/60 file:mr-3 file:rounded-lg file:border-0 file:bg-foreground/10 file:px-3 file:py-2 file:text-xs file:font-medium hover:file:bg-foreground/20"
                />
                {uploadingGallery && <p className="mt-1 text-xs text-foreground/50">Uploading…</p>}
                {uploadError && <p className="mt-1 text-xs text-red-400">{uploadError}</p>}
              </div>
              <div>
                <label className="text-xs font-medium">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5">Cancel</button>
              <button type="button" onClick={handleAdd} disabled={submitting || !form.name || !form.brand || !form.categoryId || !form.city || !form.pricePerDay || !form.imageUrl} className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50">{submitting ? "Adding..." : "Add Bike"}</button>
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