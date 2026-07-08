"use client";

import { useState } from "react";

export function ProfileSettings({ name, email, phone: initialPhone }: { name: string; email: string; phone: string | null }) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/user/phone", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-foreground/50">Name</label>
        <input readOnly value={name} className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-foreground/50">Email</label>
        <input readOnly value={email} className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-foreground/50">Phone (for SOS)</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          placeholder="+1234567890"
          className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
        </button>
      </div>
    </form>
  );
}