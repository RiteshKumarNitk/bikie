export function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-3xl p-5 ${highlight ? "bg-gold/10 ring-1 ring-gold/30" : "bg-card"}`}>
      <p className="text-xs text-foreground/50">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${highlight ? "text-gold" : ""}`}>{value}</p>
    </div>
  );
}
