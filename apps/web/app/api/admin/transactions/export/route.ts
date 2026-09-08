import { NextResponse } from "next/server";
import { AdminBillingService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { parseAdminTransactionsQuery } from "@/lib/admin-transactions-query";

/** CSV of the transaction ledger under the *currently applied* filters (ADR-076). Admin-only,
 * capped at `MAX_ADMIN_CSV_ROWS` server-side. */
export async function GET(request: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const query = parseAdminTransactionsQuery(new URL(request.url));
  if (!query) return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });

  const { csv, filename } = await AdminBillingService.exportTransactionsCsv(query);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
