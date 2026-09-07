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
  // null = no form open, "new" = create form, "<id>" = editing that plan.
  const [editing, setEditing] = useState<string | null>(null);
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
    toast.success(p.isActive ? "Plan deactivated" : "Plan activated");
  }

  async function deletePlan(p: Plan) {
    if (!window.confirm(`Delete the "${p.name}" plan? This can't be undone.`)) return;
    const res = await fetch(`${basePath}/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      setList((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Plan deleted successfully");
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    const message =
      typeof data.error === "string" ? data.error : "Unable to delete this plan. Please try again.";
    // A plan with any current or past subscriber can't be deleted (the DB keeps the reference so
    // billing history stays intact — see the API route). Offer the supported alternative inline.
    if (res.status === 409 && p.isActive) {
      if (window.confirm(`${message}\n\nDeactivate "${p.name}" now so it's no longer offered?`)) {
        void toggleActive(p);
      }
      return;
    }
    toast.error(message);
  }

  function onSaved(saved: Plan) {
    setList((prev) => {
      const exists = prev.some((x) => x.id === saved.id);
      return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved];
    });
    setEditing(null);
  }

  return (
    <div className="mt-6 space-y-4">
      <button
        onClick={() => setEditing(editing === "new" ? null : "new")}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black transition hover:bg-gold/90"
      >
        {editing === "new" ? "Cancel" : "Add Plan"}
      </button>

      {editing === "new" && (
        <PlanForm
          basePath={basePath}
          defaultDurationDays={defaultDurationDays}
          onSaved={onSaved}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((p) =>
          editing === p.id ? (
            <PlanForm
              key={p.id}
              basePath={basePath}
              defaultDurationDays={defaultDurationDays}
              plan={p}
              onSaved={onSaved}
              onCancel={() => setEditing(null)}
            />
          ) : (
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
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => toggleActive(p)}
                  className={`rounded px-3 py-1 text-xs ${p.isActive ? "bg-green-600/30 text-green-400" : "bg-white/10 text-white/50"}`}
                >
                  {p.isActive ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => setEditing(p.id)}
                  className="rounded bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/20"
                >
                  Edit
                </button>
                <button onClick={() => deletePlan(p)} className="rounded bg-red-600/30 px-3 py-1 text-xs text-red-400">
                  Delete
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function PlanForm({
  basePath,
  defaultDurationDays,
  plan,
  onSaved,
  onCancel,
}: {
  basePath: string;
  defaultDurationDays: number;
  /** Present = edit mode (PATCH `${basePath}/${plan.id}`); absent = create mode (POST `basePath`). */
  plan?: Plan;
  onSaved: (p: Plan) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [price, setPrice] = useState(plan?.price ?? 0);
  const [durationDays, setDurationDays] = useState(plan?.durationDays ?? defaultDurationDays);
  const [benefits, setBenefits] = useState(plan?.benefits.join(", ") ?? "");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        name,
        description,
        price,
        durationDays,
        benefits: benefits.split(",").map((b) => b.trim()).filter(Boolean),
      };
      const res = await fetch(plan ? `${basePath}/${plan.id}` : basePath, {
        method: plan ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        toast.error(plan ? "Unable to save changes. Please try again." : "Unable to create this plan. Please try again.");
        return;
      }
      const data = (await res.json()) as { plan: Plan };
      onSaved(data.plan);
      toast.success(plan ? "Plan updated successfully" : "Plan created successfully");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white/5 p-4 backdrop-blur">
      {plan && <p className="mb-3 text-xs font-medium uppercase tracking-wide text-white/40">Editing “{plan.name}”</p>}
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
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={loading} className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black transition hover:bg-gold/90 disabled:opacity-60">
          {loading ? "Saving…" : plan ? "Save changes" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/20">
          Cancel
        </button>
      </div>
    </form>
  );
}
