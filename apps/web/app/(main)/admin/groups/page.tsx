import type { Metadata } from "next";
import { getJson } from "@/lib/api";
import { GroupsManager, type AdminGroup, type AdminUserOption } from "@/components/admin/GroupsManager";

export const metadata: Metadata = { title: "Groups" };

export default async function AdminGroupsPage() {
  const [{ groups }, { users }] = await Promise.all([
    getJson<{ groups: AdminGroup[] }>("/api/admin/groups", { auth: true }),
    getJson<{ users: AdminUserOption[] }>("/api/admin/users", { auth: true }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Groups</h1>
      <p className="mt-1 text-sm text-white/50">
        Manage BIKIE Communities and Clubs. Groups are admin-seeded — riders join existing groups, they don&apos;t create their own yet.
      </p>
      <GroupsManager initial={groups} users={users} />
    </div>
  );
}
