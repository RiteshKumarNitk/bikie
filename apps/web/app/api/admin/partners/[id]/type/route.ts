import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { updatePartnerTypeSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

/** Admin sets/changes a provider's service category — kept separate from the
 * verification-decision endpoint (`PATCH /api/admin/partners/[id]`) since this is a plain
 * profile-data edit, not a trust/safety state transition. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const parsed = updatePartnerTypeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await AdminService.updatePartnerType(id, parsed.data.type);

  await logAdminAction({
    userId: session.user.id,
    action: "UPDATE_PARTNER_TYPE",
    entity: "Partner",
    entityId: id,
    metadata: { type: parsed.data.type },
  });

  return NextResponse.json({ success: true, type: parsed.data.type });
}
