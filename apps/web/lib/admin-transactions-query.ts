import { adminTransactionsQuerySchema } from "@bikie/validation";
import type { AdminTransactionQuery } from "@bikie/services";

/** Parse `/api/admin/transactions` (and its `/export`) query string into the service query.
 * Returns `null` on invalid input so the route can 400. */
export function parseAdminTransactionsQuery(url: URL): AdminTransactionQuery | null {
  const p = url.searchParams;
  const parsed = adminTransactionsQuerySchema.safeParse({
    page: p.get("page") ?? undefined,
    pageSize: p.get("pageSize") ?? undefined,
    sort: p.get("sort"),
    accountType: p.get("accountType"),
    status: p.get("status"),
    planId: p.get("planId"),
    from: p.get("from"),
    to: p.get("to"),
    search: p.get("search"),
  });
  if (!parsed.success) return null;
  return parsed.data;
}
