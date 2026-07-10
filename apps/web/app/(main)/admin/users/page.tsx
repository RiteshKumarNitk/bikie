"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const roles = ["RENTER", "PARTNER", "ADMIN"];

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { setUsers(data.users); setLoading(false); });
  }, []);

  async function handleUpdateRole() {
    if (!editingUser) return;
    await fetch(`/api/admin/users/${editingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setEditingUser(null);
    setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, role: newRole } : u)));
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setDeletingId(null);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return <div className="h-48 animate-pulse rounded-3xl bg-card" />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users ({users.length})</h1>
      </div>

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
                    user.role === "ADMIN" ? "bg-accent/15 text-accent-text" :
                    user.role === "PARTNER" ? "bg-blue-500/15 text-blue-400" :
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
                      onClick={() => { setEditingUser(user); setNewRole(user.role); }}
                      className="rounded-lg border border-foreground/10 px-3 py-1 text-xs font-medium transition-colors hover:bg-foreground/5"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(user.id)}
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
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setEditingUser(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Change Role</h3>
            <p className="mt-1 text-sm text-foreground/50">{editingUser.name}</p>
            <div className="mt-4 space-y-2">
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
                onClick={handleUpdateRole}
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