"use client";

import { useState, useEffect } from "react";

interface AdminBooking {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  bike: { name: string; slug: string };
  renter: { name: string; email: string };
}

const statuses = ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [editingBooking, setEditingBooking] = useState<AdminBooking | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/bookings")
      .then((r) => r.json())
      .then((data) => { setBookings(data.bookings); setLoading(false); });
  }, []);

  async function handleUpdateStatus() {
    if (!editingBooking) return;
    await fetch(`/api/admin/bookings/${editingBooking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setBookings((prev) => prev.map((b) => (b.id === editingBooking.id ? { ...b, status: newStatus } : b)));
    setEditingBooking(null);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    setDeletingId(null);
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }

  const filtered = bookings.filter((b) => !statusFilter || b.status === statusFilter);

  if (loading) return <div className="h-48 animate-pulse rounded-3xl bg-card" />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bookings ({bookings.length})</h1>
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
              <th className="px-5 py-3 font-medium">Bike</th>
              <th className="px-5 py-3 font-medium">Renter</th>
              <th className="px-5 py-3 font-medium">Dates</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((booking) => (
              <tr key={booking.id} className="border-b border-foreground/5 last:border-0">
                <td className="px-5 py-3 font-medium">{booking.bike.name}</td>
                <td className="px-5 py-3 text-foreground/60">{booking.renter.email}</td>
                <td className="px-5 py-3 text-foreground/60">
                  {new Date(booking.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} –{" "}
                  {new Date(booking.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
                <td className="px-5 py-3">₹{booking.totalPrice}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    booking.status === "COMPLETED" ? "bg-success/15 text-success" :
                    booking.status === "CANCELLED" ? "bg-red-500/15 text-red-400" :
                    booking.status === "ACTIVE" ? "bg-blue-500/15 text-blue-400" :
                    booking.status === "CONFIRMED" ? "bg-accent/15 text-accent" :
                    "bg-warning/15 text-warning"
                  }`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setEditingBooking(booking); setNewStatus(booking.status); }}
                      className="rounded-lg border border-foreground/10 px-3 py-1 text-xs font-medium transition-colors hover:bg-foreground/5"
                    >
                      Status
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(booking.id)}
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
          <div className="p-8 text-center text-sm text-foreground/50">No bookings found</div>
        )}
      </div>

      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setEditingBooking(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Update Booking Status</h3>
            <p className="mt-1 text-sm text-foreground/50">{editingBooking.bike.name} — {editingBooking.renter.email}</p>
            <div className="mt-4 space-y-2">
              {statuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewStatus(s)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                    newStatus === s
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-foreground/10 hover:border-foreground/20"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setEditingBooking(null)} className="flex-1 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5">Cancel</button>
              <button type="button" onClick={handleUpdateStatus} className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover">Save</button>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeletingId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Delete Booking?</h3>
            <p className="mt-2 text-sm text-foreground/50">This will permanently remove this booking record.</p>
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