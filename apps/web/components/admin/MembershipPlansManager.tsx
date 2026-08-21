"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  benefits: string[];
  isActive: boolean;
};

/** `basePath` defaults to the Rider membership plans API; the Partner Membership admin page
 * (ADR-051) passes `/api/admin/partner-membership/plans` to reuse this manager unchanged
 * against its own separate plan table. */
export function MembershipPlansManager({
  initial,
  basePath = "/api/admin/membership/plans",
  defaultDurationDays = 30,
}: {
  initial: Plan[];
  basePath?: string;
  defaultDurationDays?: number;
}) {
  const [list, setList] = useState<Plan[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  async function toggleActive(p: Plan) {
    const res = await fetch(`${basePath}/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (!res.ok) {
      toast.error("Unable to complete the request. Please try again.");
      return;
    }
    setList((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x)));
    toast.success("Plan updated successfully");
  }

  async function deletePlan(id: string) {
    const res = await fetch(`${basePath}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}) as { error?: string });
      toast.error(typeof data.error === "string" ? data.error : "Unable to delete this plan. Please try again.");
      return;
    }
    setList((prev) => prev.filter((x) => x.id !== id));
    toast.success("Plan deleted successfully");
  }

  return (
    <div className="mt-6 space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black transition hover:bg-gold/90">
        {showForm ? "Cancel" : "Add Plan"}
      </button>

      {showForm && (
        <PlanForm
          basePath={basePath}
          defaultDurationDays={defaultDurationDays}
          onCreated={(p) => { setList((prev) => [...prev, p]); setShowForm(false); }}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((p) => (
          <div key={p.id} className="rounded-xl bg-white/5 p-4 backdrop-blur">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-white/50">{p.description}</p>
              </div>
              <p className="text-lg font-semibold text-gold">{p.price === 0 ? "Free" : `₹${p.price}`}</p>
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

function PlanForm({
  basePath,
  defaultDurationDays,
  onCreated,
}: {
  basePath: string;
  defaultDurationDays: number;
  onCreated: (p: Plan) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [durationDays, setDurationDays] = useState(defaultDurationDays);
  const [benefits, setBenefits] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(basePath, {
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
      if (!res.ok) {
        toast.error("Unable to create this plan. Please try again.");
        return;
      }
      const data = await res.json();
      onCreated(data.plan);
      toast.success("Plan created successfully");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white/5 p-4 backdrop-blur">
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Plan name" required className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" required className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30" />
        <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price (₹, 0 = free)" className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white" />
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
