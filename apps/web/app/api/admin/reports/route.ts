import { NextResponse } from "next/server";
import { AdminBillingService } from "@bikie/services";
import { adminRevenueReportQuerySchema, type AdminRevenueReportQuery } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";

/** Admin revenue + membership report. Admin-only (`requireRole`), server-side aggregation over
 * `MembershipInvoice` — no financial figure is ever exposed to a non-admin session. */
export async function GET(request: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const url = new URL(request.url);
  const parsed = adminRevenueReportQuerySchema.safeParse({
    range: url.searchParams.get("range"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { from, to, key } = resolveRange(parsed.data);
  const report = await AdminBillingService.getRevenueReport({ from, to, key });
  return NextResponse.json({ report });
}

function resolveRange(q: AdminRevenueReportQuery): { from: Date; to: Date; key: string } {
  const now = new Date();
  const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const startOfDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const daysAgo = (n: number) => startOfDay(new Date(now.getTime() - n * 86_400_000));

  switch (q.range) {
    case "today":
      return { from: startOfDay(now), to: endOfToday, key: "today" };
    case "yesterday": {
      const y = daysAgo(1);
      return { from: y, to: new Date(y.getTime() + 86_399_999), key: "yesterday" };
    }
    case "last7":
      return { from: daysAgo(6), to: endOfToday, key: "last7" };
    case "last30":
      return { from: daysAgo(29), to: endOfToday, key: "last30" };
    case "thisMonth":
      return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), to: endOfToday, key: "thisMonth" };
    case "lastMonth": {
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 1);
      return { from, to, key: "lastMonth" };
    }
    case "thisYear":
      return { from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)), to: endOfToday, key: "thisYear" };
    case "custom": {
      const from = q.from ? startOfDay(q.from) : daysAgo(29);
      const to = q.to ? new Date(startOfDay(q.to).getTime() + 86_399_999) : endOfToday;
      return { from, to, key: "custom" };
    }
  }
}
