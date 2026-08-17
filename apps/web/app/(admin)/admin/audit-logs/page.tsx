import type { Metadata } from "next";
import { getJson } from "@/lib/api";
import { AuditLogsTable } from "@/components/admin/AuditLogsTable";

export const metadata: Metadata = { title: "Audit Logs" };

export default async function AuditLogsPage() {
  const { logs } = await getJson<{ logs: any[] }>("/api/admin/audit-logs", { auth: true });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Audit Logs</h1>
      <AuditLogsTable logs={logs} />
    </div>
  );
}