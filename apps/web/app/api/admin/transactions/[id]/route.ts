import { NextResponse } from "next/server";
import { AdminBillingService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

/** Admin-only single transaction detail (ADR-076). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const transaction = await AdminBillingService.getTransaction(id);
  if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  return NextResponse.json({ transaction });
}
