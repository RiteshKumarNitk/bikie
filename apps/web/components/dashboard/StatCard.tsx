export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl bg-card p-5">
      <p className="text-xs text-foreground/50">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
