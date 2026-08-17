"use client";

import { useState, useEffect } from "react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  accountType?: string | null;
  partnerStatus?: string | null;
  createdAt: string;
}

const roles = ["RENTER", "PARTNER", "ADMIN"];
const accountTypes = ["RIDER", "SERVICE_PROVIDER"] as const;

type Tab = "ALL" | "RIDER" | "SERVICE_PROVIDER";
const tabs: { key: Tab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "RIDER", label: "Riders" },
  { key: "SERVICE_PROVIDER", label: "Service Providers" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("ALL");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState("");
  const [newAccountType, setNewAccountType] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { setUsers(data.users); setLoading(false); });
    const initial = new URLSearchParams(window.location.search).get("type");
    if (initial === "RIDER" || initial === "SERVICE_PROVIDER") setTab(initial);
  }, []);

  async function handleUpdateUser() {
    if (!editingUser) return;
    const body: { role?: string; accountType?: string } = {};
    if (newRole !== editingUser.role) body.role = newRole;
    if (newAccountType && newAccountType !== editingUser.accountType) body.accountType = newAccountType;
    setSaveError(null);
    const res = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setSaveError(data?.error ?? "Failed to update this user.");
      return;
    }
    setEditingUser(null);
    setUsers((prev) =>
      prev.map((u) => (u.id === editingUser.id ? { ...u, ...body } : u)),
    );
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setDeleteError(data?.error ?? "Failed to delete this user.");
      setDeletingId(null);
      return;
    }
    setDeleteError(null);
    setDeletingId(null);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  const filtered = users.filter((u) => {
    if (tab !== "ALL" && (u.accountType ?? "RIDER") !== tab) return false;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  if (loading) return <div className="h-48 animate-pulse rounded-3xl bg-card" />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users ({filtered.length})</h1>
        <div className="flex rounded-xl border border-foreground/10 bg-card p-1 text-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                tab === t.key ? "bg-accent text-white" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {(deleteError || saveError) && (
        <div className="mt-4 flex items-start justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span>{deleteError ?? saveError}</span>
          <button
            type="button"
            onClick={() => { setDeleteError(null); setSaveError(null); }}
            className="shrink-0 font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-4">
        <input
          type="text"
          placeholder="Search by name or email..."
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
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Account Type</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Joined</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-foreground/5 last:border-0">
                <td className="px-5 py-3 font-medium">{user.name}</td>
                <td className="px-5 py-3 text-foreground/60">{user.email}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    (user.accountType ?? "RIDER") === "SERVICE_PROVIDER"
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-foreground/5 text-foreground/60"
                  }`}>
                    {user.accountType ?? "RIDER"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    user.role === "ADMIN" ? "bg-accent/15 text-accent-text" :
                    user.role === "PARTNER" ? "bg-purple-500/15 text-purple-400" :
                    "bg-foreground/5 text-foreground/60"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-foreground/60">
                  {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUser(user);
                        setNewRole(user.role);
                        setNewAccountType(user.accountType ?? "RIDER");
                        setSaveError(null);
                      }}
                      className="rounded-lg border border-foreground/10 px-3 py-1 text-xs font-medium transition-colors hover:bg-foreground/5"
                    >
                      Edit
                    </button>
                    {user.role !== "ADMIN" && (
                      <button
                        type="button"
                        onClick={() => setDeletingId(user.id)}
                        className="rounded-lg border border-red-500/20 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setEditingUser(null)}>
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Edit User</h3>
            <p className="mt-1 text-sm text-foreground/50">{editingUser.name}</p>

            {saveError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {saveError}
              </div>
            )}

            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-foreground/50">Account Type</p>
            <div className="mt-2 space-y-2">
              {accountTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewAccountType(type)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                    newAccountType === type
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-foreground/10 hover:border-foreground/20"
                  }`}
                >
                  {type === "RIDER" ? "Rider" : "Service Provider"}
                </button>
              ))}
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-foreground/50">Role</p>
            <div className="mt-2 space-y-2">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setNewRole(role)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                    newRole === role
                      ? "border-accent bg-accent/10 text-accent-text"
                      : "border-foreground/10 hover:border-foreground/20"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateUser}
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeletingId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Delete User?</h3>
            <p className="mt-2 text-sm text-foreground/50">This action cannot be undone. All user data will be permanently removed.</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}