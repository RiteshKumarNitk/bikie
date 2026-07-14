"use client";

import { useState, useEffect } from "react";

interface AdminTrip {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  price: number;
  seatsTotal: number;
  seatsLeft: number;
  startDate: string;
  endDate: string;
  status: string;
  organizer: { id: string; name: string; email: string };
  createdAt: string;
}

const statuses = ["DRAFT", "PUBLISHED", "UPCOMING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<AdminTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [editingTrip, setEditingTrip] = useState<AdminTrip | null>(null);
  const [form, setForm] = useState({ title: "", description: "", seatsTotal: 0, startDate: "", endDate: "", status: "" });
  const [saving, setSaving] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/trips")
      .then((r) => r.json())
      .then((data) => {
        setTrips(data.trips ?? []);
        setLoading(false);
      });
  }, []);

  function openEdit(trip: AdminTrip) {
    setEditingTrip(trip);
    setForm({
      title: trip.title,
      description: trip.description,
      seatsTotal: trip.seatsTotal,
      startDate: toDateInputValue(trip.startDate),
      endDate: toDateInputValue(trip.endDate),
      status: trip.status,
    });
  }

  async function handleSaveEdit() {
    if (!editingTrip) return;
    setSaving(true);
    const res = await fetch(`/api/admin/trips/${editingTrip.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.trip) {
      setTrips((prev) => prev.map((t) => (t.id === editingTrip.id ? data.trip : t)));
    }
    setSaving(false);
    setEditingTrip(null);
  }

  async function handleCancelRide(id: string) {
    const res = await fetch(`/api/admin/trips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    const data = await res.json();
    if (data.trip) {
      setTrips((prev) => prev.map((t) => (t.id === id ? data.trip : t)));
    }
    setCancelingId(null);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/trips/${id}`, { method: "DELETE" });
    setTrips((prev) => prev.filter((t) => t.id !== id));
    setDeletingId(null);
  }

  const filtered = trips.filter((t) => !statusFilter || t.status === statusFilter);

  if (loading) return <div className="h-48 animate-pulse rounded-3xl bg-card" />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trips ({trips.length})</h1>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("")}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${!statusFilter ? "bg-accent text-white" : "border border-foreground/10 hover:bg-foreground/5"}`}
        >
          All
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${statusFilter === s ? "bg-accent text-white" : "border border-foreground/10 hover:bg-foreground/5"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-foreground/10 bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-foreground/50">
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Organizer</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Seats Avail.</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((trip) => (
              <tr key={trip.id} className="border-b border-foreground/5 last:border-0">
                <td className="px-5 py-3 font-medium">{trip.title}</td>
                <td className="px-5 py-3 text-foreground/60">{trip.organizer.name}</td>
                <td className="px-5 py-3 text-foreground/60">{trip.type.replace("_", " ")}</td>
                <td className="px-5 py-3 text-foreground/60">
                  {trip.seatsLeft} of {trip.seatsTotal}
                </td>
                <td className="px-5 py-3">₹{trip.price}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      trip.status === "CANCELLED"
                        ? "bg-red-500/15 text-red-400"
                        : trip.status === "COMPLETED"
                          ? "bg-success/15 text-success"
                          : "bg-foreground/5 text-foreground/60"
                    }`}
                  >
                    {trip.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(trip)}
                      className="rounded-lg border border-foreground/10 px-3 py-1 text-xs font-medium transition-colors hover:bg-foreground/5"
                    >
                      Edit
                    </button>
                    {trip.status !== "CANCELLED" && trip.status !== "COMPLETED" && (
                      <button
                        type="button"
                        onClick={() => setCancelingId(trip.id)}
                        className="rounded-lg border border-warning/30 px-3 py-1 text-xs font-medium text-warning transition-colors hover:bg-warning/10"
                      >
                        Cancel Ride
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeletingId(trip.id)}
                      className="rounded-lg border border-red-500/20 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-foreground/50">No trips found</div>
        )}
      </div>

      {editingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingTrip(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Edit Trip</h3>
            <p className="mt-1 text-sm text-foreground/50">{editingTrip.organizer.name} — {editingTrip.organizer.email}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground/50">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/50">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground/50">Seats Total</label>
                  <input
                    type="number"
                    min={1}
                    value={form.seatsTotal}
                    onChange={(e) => setForm((f) => ({ ...f, seatsTotal: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/50">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s} className="bg-card">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground/50">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/50">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setEditingTrip(null)} className="flex-1 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5">Cancel</button>
              <button type="button" disabled={saving} onClick={handleSaveEdit} className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setCancelingId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Cancel this ride?</h3>
            <p className="mt-2 text-sm text-foreground/50">The trip status will be set to CANCELLED. Riders will no longer be able to join.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setCancelingId(null)} className="flex-1 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5">Back</button>
              <button type="button" onClick={() => handleCancelRide(cancelingId)} className="flex-1 rounded-xl bg-warning px-4 py-2.5 text-sm font-medium text-black transition-colors hover:opacity-90">Cancel Ride</button>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeletingId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Delete Trip?</h3>
            <p className="mt-2 text-sm text-foreground/50">This will permanently remove this trip and all associated data.</p>
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
