"use client";

import { useState, useMemo } from "react";

export function AuditLogsTable({ logs }: { logs: any[] }) {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (search && !log.action.toLowerCase().includes(search.toLowerCase()) && !log.entityId?.toLowerCase().includes(search.toLowerCase())) return false;
      if (entityFilter && log.entity !== entityFilter) return false;
      return true;
    });
  }, [logs, search, entityFilter]);

  const entities = useMemo(() => [...new Set(logs.map((l) => l.entity))], [logs]);

  return (
    <div>
      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by action or entity ID…"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-accent"
        />
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent"
        >
          <option value="">All entities</option>
          {entities.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-white/5 backdrop-blur">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50">
              <th className="p-3 font-medium">Action</th>
              <th className="p-3 font-medium">Entity</th>
              <th className="p-3 font-medium">Entity ID</th>
              <th className="p-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-sm text-white/30">No matching audit logs</td></tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="border-b border-white/5 text-white/80 last:border-0">
                  <td className="p-3 font-mono text-xs">{log.action}</td>
                  <td className="p-3">{log.entity}</td>
                  <td className="p-3 font-mono text-xs text-white/50" title={log.entityId}>{log.entityId?.slice(0, 12)}…</td>
                  <td className="p-3 text-white/50">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}