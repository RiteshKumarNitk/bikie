"use client";

import { useState } from "react";

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  benefits: string[];
  isActive: boolean;
};

export function MembershipPlansManager({ initial }: { initial: Plan[] }) {
  const [list, setList] = useState<Plan[]>(initial);
  const [showForm, setShowForm] = useState(false);

  async function toggleActive(p: Plan) {
    await fetch(`/api/admin/membership/plans/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    setList((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x)));
  }

  async function deletePlan(id: string) {
    await fetch(`/api/admin/membership/plans/${id}`, { method: "DELETE" });
    setList((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="mt-6 space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black transition hover:bg-gold/90">
        {showForm ? "Cancel" : "Add Plan"}
      </button>

      {showForm && <PlanForm onCreated={(p) => { setList((prev) => [...prev, p]); setShowForm(false); }} />}

      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((p) => (
          <div key={p.id} className="rounded-xl bg-white/5 p-4 backdrop-blur">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-white/50">{p.description}</p>
              </div>
              <p className="text-lg font-semibold text-gold">₹{p.price}</p>
            </div>
            <p className="mt-2 text-xs text-white/50">{p.durationDays} days</p>
            <ul className="mt-2 space-y-1">
              {p.benefits.map((b, i) => (
                <li key={i} className="text-xs text-white/70">✓ {b}</li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => toggleActive(p)}
                className={`rounded px-3 py-1 text-xs ${p.isActive ? "bg-green-600/30 text-green-400" : "bg-white/10 text-white/50"}`}
              >
                {p.isActive ? "Active" : "Inactive"}
              </button>
              <button onClick={() => deletePlan(p.id)} className="rounded bg-red-600/30 px-3 py-1 text-xs text-red-400">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanForm({ onCreated }: { onCreated: (p: Plan) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(999);
  const [durationDays, setDurationDays] = useState(30);
  const [benefits, setBenefits] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/membership/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        price,
        durationDays,
        benefits: benefits.split(",").map((b) => b.trim()).filter(Boolean),
      }),
    });
    const data = await res.json();
    onCreated(data.plan);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white/5 p-4 backdrop-blur">
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Plan name" required className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" required className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30" />
        <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price (₹)" className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white" />
        <input type="number" min={1} value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} placeholder="Duration (days)" className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white" />
      </div>
      <textarea
        value={benefits}
        onChange={(e) => setBenefits(e.target.value)}
        placeholder="Benefits, comma separated (e.g. 10% off bookings, Free cancellation, Priority support)"
        rows={2}
        className="mt-3 w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30"
      />
      <button type="submit" disabled={loading} className="mt-3 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black transition hover:bg-gold/90">
        {loading ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
