"use client";

import { useState } from "react";

export type GroupType = "COMMUNITY" | "CLUB";

export interface AdminGroup {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  type: GroupType;
  city: string | null;
  isPrivate: boolean;
  owner: { id: string; name: string; email: string };
  memberCount: number;
  createdAt: string;
}

export interface AdminUserOption {
  id: string;
  name: string;
  email: string;
}

const emptyForm = {
  name: "",
  description: "",
  imageUrl: "",
  type: "COMMUNITY" as GroupType,
  city: "",
  isPrivate: false,
  ownerId: "",
};

export function GroupsManager({ initial, users }: { initial: AdminGroup[]; users: AdminUserOption[] }) {
  const [groups, setGroups] = useState<AdminGroup[]>(initial);
  const [typeFilter, setTypeFilter] = useState<"" | GroupType>("");
  const [showForm, setShowForm] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AdminGroup | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = groups.filter((g) => !typeFilter || g.type === typeFilter);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const res = await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create group");
      setCreating(false);
      return;
    }
    setGroups((prev) => [data.group, ...prev]);
    setCreateForm(emptyForm);
    setShowForm(false);
    setCreating(false);
  }

  function openEdit(group: AdminGroup) {
    setEditingGroup(group);
    setEditForm({
      name: group.name,
      description: group.description,
      imageUrl: group.imageUrl,
      type: group.type,
      city: group.city ?? "",
      isPrivate: group.isPrivate,
      ownerId: group.owner.id,
    });
  }

  async function handleSaveEdit() {
    if (!editingGroup) return;
    setSaving(true);
    const res = await fetch(`/api/admin/groups/${editingGroup.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (data.group) {
      setGroups((prev) => prev.map((g) => (g.id === editingGroup.id ? data.group : g)));
    }
    setSaving(false);
    setEditingGroup(null);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTypeFilter("")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${!typeFilter ? "bg-accent text-white" : "border border-foreground/10 hover:bg-foreground/5"}`}
          >
            All ({groups.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("COMMUNITY")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${typeFilter === "COMMUNITY" ? "bg-accent text-white" : "border border-foreground/10 hover:bg-foreground/5"}`}
          >
            Communities
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("CLUB")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${typeFilter === "CLUB" ? "bg-accent text-white" : "border border-foreground/10 hover:bg-foreground/5"}`}
          >
            Clubs
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black transition hover:bg-gold/90"
        >
          {showForm ? "Cancel" : "Add Group"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-4 rounded-2xl border border-foreground/10 bg-card p-5">
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Group name"
              required
              className="rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
            <select
              value={createForm.type}
              onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as GroupType }))}
              className="rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
            >
              <option value="COMMUNITY" className="bg-card">Community</option>
              <option value="CLUB" className="bg-card">Club</option>
            </select>
            <input
              value={createForm.city}
              onChange={(e) => setCreateForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="City (optional)"
              className="rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
            <input
              value={createForm.imageUrl}
              onChange={(e) => setCreateForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="Image URL"
              required
              className="rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
            <select
              value={createForm.ownerId}
              onChange={(e) => setCreateForm((f) => ({ ...f, ownerId: e.target.value }))}
              required
              className="rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 sm:col-span-2"
            >
              <option value="" className="bg-card">Select owner…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-card">
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-foreground/70 sm:col-span-2">
              <input
                type="checkbox"
                checked={createForm.isPrivate}
                onChange={(e) => setCreateForm((f) => ({ ...f, isPrivate: e.target.checked }))}
              />
              Private group
            </label>
          </div>
          <textarea
            value={createForm.description}
            onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description"
            required
            rows={3}
            className="mt-3 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
          <button
            type="submit"
            disabled={creating}
            className="mt-3 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create Group"}
          </button>
        </form>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-foreground/10 bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-foreground/50">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">City</th>
              <th className="px-5 py-3 font-medium">Owner</th>
              <th className="px-5 py-3 font-medium">Members</th>
              <th className="px-5 py-3 font-medium">Visibility</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((group) => (
              <tr key={group.id} className="border-b border-foreground/5 last:border-0">
                <td className="px-5 py-3 font-medium">{group.name}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium">{group.type}</span>
                </td>
                <td className="px-5 py-3 text-foreground/60">{group.city ?? "—"}</td>
                <td className="px-5 py-3 text-foreground/60">{group.owner.name}</td>
                <td className="px-5 py-3 text-foreground/60">{group.memberCount}</td>
                <td className="px-5 py-3 text-foreground/60">{group.isPrivate ? "Private" : "Public"}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(group)}
                      className="rounded-lg border border-foreground/10 px-3 py-1 text-xs font-medium transition-colors hover:bg-foreground/5"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(group.id)}
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
          <div className="p-8 text-center text-sm text-foreground/50">No groups found</div>
        )}
      </div>

      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingGroup(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Edit Group</h3>
            <div className="mt-4 space-y-3">
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Group name"
                className="w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as GroupType }))}
                  className="rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                >
                  <option value="COMMUNITY" className="bg-card">Community</option>
                  <option value="CLUB" className="bg-card">Club</option>
                </select>
                <input
                  value={editForm.city}
                  onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="City"
                  className="rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>
              <input
                value={editForm.imageUrl}
                onChange={(e) => setEditForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="Image URL"
                className="w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              />
              <select
                value={editForm.ownerId}
                onChange={(e) => setEditForm((f) => ({ ...f, ownerId: e.target.value }))}
                className="w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-card">
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              />
              <label className="flex items-center gap-2 text-sm text-foreground/70">
                <input
                  type="checkbox"
                  checked={editForm.isPrivate}
                  onChange={(e) => setEditForm((f) => ({ ...f, isPrivate: e.target.checked }))}
                />
                Private group
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setEditingGroup(null)} className="flex-1 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5">Cancel</button>
              <button type="button" disabled={saving} onClick={handleSaveEdit} className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeletingId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Delete Group?</h3>
            <p className="mt-2 text-sm text-foreground/50">This will permanently remove this group and its membership list. The group&apos;s chat conversation, if any, is not deleted.</p>
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
