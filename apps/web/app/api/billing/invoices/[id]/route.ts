import { NextResponse } from "next/server";
import { BillingService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

/**
 * `GET /api/billing/invoices/[id]` (ADR-070) — one invoice, as JSON. Returns **404 for both a
 * non-existent id and an id that belongs to another user** (`getInvoice` yields `null` in both
 * cases), so invoice ids can't be probed by swapping the path segment.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const invoice = await BillingService.getInvoice(session.user.id, id);
  if (!invoice) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ invoice });
}
