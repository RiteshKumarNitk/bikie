import type { Metadata } from "next";

export const metadata: Metadata = { title: "Users" };

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

import { getJson } from "@/lib/api";

export default async function AdminUsersPage() {
  const { users } = await getJson<{ users: AdminUser[] }>("/api/admin/users", { auth: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Users ({users.length})</h1>
      <div className="mt-6 overflow-x-auto rounded-3xl bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-foreground/50">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-foreground/5 last:border-0">
                <td className="px-5 py-3">{user.name}</td>
                <td className="px-5 py-3 text-foreground/60">{user.email}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium">{user.role}</span>
                </td>
                <td className="px-5 py-3 text-foreground/60">
                  {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
