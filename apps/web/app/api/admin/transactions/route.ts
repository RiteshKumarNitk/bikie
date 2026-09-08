import { NextResponse } from "next/server";
import { AdminBillingService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { parseAdminTransactionsQuery } from "@/lib/admin-transactions-query";

/** Admin-only, server-side paginated + filtered financial transaction list (ADR-076). Reads the
 * `MembershipInvoice` ledger; never exposes any figure to a non-admin session. */
export async function GET(request: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const query = parseAdminTransactionsQuery(new URL(request.url));
  if (!query) return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });

  const [list, planFacets] = await Promise.all([
    AdminBillingService.listTransactions(query),
    AdminBillingService.listPlanFacets(),
  ]);
  return NextResponse.json({ ...list, facets: { plans: planFacets } });
}
