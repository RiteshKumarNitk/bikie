import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await _request.json();
  await AdminService.updatePartnerVerification(id, body.isVerified);
  await logAdminAction({
    userId: session.user.id,
    action: body.isVerified ? "VERIFY_PARTNER" : "REJECT_PARTNER",
    entity: "Partner",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  await AdminService.deletePartner(id);
  await logAdminAction({
    userId: session.user.id,
    action: "DELETE_PARTNER",
    entity: "Partner",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}