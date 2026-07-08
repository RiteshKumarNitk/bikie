"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#e8a838",
  CONFIRMED: "#22c55e",
  ACTIVE: "#3b82f6",
  CANCELLED: "#ef4444",
  COMPLETED: "#a855f7",
};

const PIE_COLORS = ["#e8a838", "#3b82f6", "#22c55e", "#ef4444", "#a855f7", "#ec4899"];

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center rounded-xl bg-white/5">
      <p className="text-sm text-white/30">{label}</p>
    </div>
  );
}

export function MonthlyBookingsChart({ data }: { data: { month: string; count: number }[] }) {
  return (
    <div className="rounded-xl bg-white/5 p-4 backdrop-blur">
      <h3 className="mb-3 text-sm font-medium text-white/70">Monthly Bookings</h3>
      {data.length === 0 ? (
        <EmptyChart label="No booking data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 10 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#111933", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
            <Bar dataKey="count" fill="#e8a838" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function BookingsByStatusChart({ data }: { data: { status: string; count: number }[] }) {
  const colored = data.map((d) => ({ ...d, fill: STATUS_COLORS[d.status] ?? "#6b7280" }));

  return (
    <div className="rounded-xl bg-white/5 p-4 backdrop-blur">
      <h3 className="mb-3 text-sm font-medium text-white/70">Bookings by Status</h3>
      {data.length === 0 ? (
        <EmptyChart label="No booking data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={colored} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name} (${value})`}>
              {colored.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function BikesByCityChart({ data }: { data: { city: string; count: number }[] }) {
  return (
    <div className="rounded-xl bg-white/5 p-4 backdrop-blur">
      <h3 className="mb-3 text-sm font-medium text-white/70">Bikes by City</h3>
      {data.length === 0 ? (
        <EmptyChart label="No bike data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 10 }} />
            <YAxis dataKey="city" type="category" tick={{ fill: "#9ca3af", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#111933", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}