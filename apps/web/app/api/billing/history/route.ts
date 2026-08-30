import { NextResponse } from "next/server";
import { BillingService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

/**
 * `GET /api/billing/history` (ADR-070) — the signed-in user's own membership payment/invoice
 * history, newest first. Scoped entirely to `session.user.id`; there is no way to ask for
 * another user's history. Covers both account types (a user's invoices from before an
 * account-type change are still theirs).
 */
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const history = await BillingService.getHistory(session.user.id);
  return NextResponse.json(history);
}
