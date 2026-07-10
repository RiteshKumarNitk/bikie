import { NextResponse } from "next/server";
import { ModerationService } from "@bikie/services";
import { moderationDurationSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const parsed = moderationDurationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await ModerationService.warnUser(id, session.user.id, parsed.data.reason, parsed.data.reportId);
  await logAdminAction({
    userId: session.user.id,
    action: "WARN_USER",
    entity: "User",
    entityId: id,
    metadata: { reason: parsed.data.reason },
  });

  return NextResponse.json({ success: true });
}
