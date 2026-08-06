"use client";

import { useState } from "react";

type Testimonial = {
  id: string;
  authorName: string;
  authorAvatarUrl: string | null;
  authorLocation: string | null;
  rating: number;
  quote: string;
  isFeatured: boolean;
  createdAt: string;
};

export function TestimonialsManager({ initial }: { initial: Testimonial[] }) {
  const [list, setList] = useState<Testimonial[]>(initial);
  const [showForm, setShowForm] = useState(false);

  async function toggleFeatured(t: Testimonial) {
    await fetch(`/api/admin/testimonials/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !t.isFeatured }),
    });
    setList((prev) => prev.map((x) => (x.id === t.id ? { ...x, isFeatured: !x.isFeatured } : x)));
  }

  async function deleteTestimonial(id: string) {
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    setList((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="mt-6 space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black transition hover:bg-gold/90">
        {showForm ? "Cancel" : "Add Testimonial"}
      </button>

      {showForm && <TestimonialForm onCreated={(t) => { setList((prev) => [t, ...prev]); setShowForm(false); }} />}

      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((t) => (
          <div key={t.id} className="rounded-xl bg-white/5 p-4 backdrop-blur">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{t.authorName}</p>
                <p className="text-xs text-white/50">{t.authorLocation ?? "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gold">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</span>
              </div>
            </div>
            <p className="mt-2 text-sm italic text-white/70">"{t.quote}"</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => toggleFeatured(t)}
                className={`rounded px-3 py-1 text-xs ${t.isFeatured ? "bg-green-600/30 text-green-400" : "bg-white/10 text-white/50"}`}
              >
                {t.isFeatured ? "Featured" : "Hidden"}
              </button>
              <button onClick={() => deleteTestimonial(t.id)} className="rounded bg-red-600/30 px-3 py-1 text-xs text-red-400">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialForm({ onCreated }: { onCreated: (t: Testimonial) => void }) {
  const [authorName, setAuthorName] = useState("");
  const [authorLocation, setAuthorLocation] = useState("");
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        setAuthorAvatarUrl(url);
      }
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorName, authorLocation, authorAvatarUrl: authorAvatarUrl ?? undefined, rating, quote }),
    });
    const data = await res.json();
    onCreated(data.testimonial);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white/5 p-4 backdrop-blur">
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Author name" required className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30" />
        <input value={authorLocation} onChange={(e) => setAuthorLocation(e.target.value)} placeholder="Location" className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30" />
        <input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        {authorAvatarUrl && (
          <img src={authorAvatarUrl} alt="Avatar" className="h-10 w-10 rounded-full object-cover" />
        )}
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={uploadingAvatar}
            className="block text-xs text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-white/20"
          />
          <p className="mt-1 text-[11px] text-white/40">{uploadingAvatar ? "Uploading…" : "Avatar photo (optional)"}</p>
        </div>
      </div>
      <textarea value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Quote" required rows={3} className="mt-3 w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30" />
      <button type="submit" disabled={loading} className="mt-3 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black transition hover:bg-gold/90">
        {loading ? "Saving…" : "Save"}
      </button>
    </form>
  );
}