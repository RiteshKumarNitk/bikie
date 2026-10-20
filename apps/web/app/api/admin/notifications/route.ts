import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { sendAdminNotificationSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

/**
 * `GET /api/admin/notifications` — recent broadcast history (`AuditLog` entries this route
 * itself writes below, filtered to `entity: "Notification"` — no separate history table).
 * `POST /api/admin/notifications` — sends a title/body announcement to an audience, reusing
 * `NotificationService.notifyMany` (the same send path every other notification type already
 * goes through: in-app row + realtime + fire-and-forget push). Never a parallel system.
 */
export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const history = await AdminService.listNotificationHistory(20);
  return NextResponse.json({ history });
}

export async function POST(request: Request) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const parsed = sendAdminNotificationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { recipientCount } = await AdminService.sendNotification({
    adminUserId: session.user.id,
    ...parsed.data,
  });

  await logAdminAction({
    userId: session.user.id,
    action: "SEND_NOTIFICATION",
    entity: "Notification",
    metadata: { audience: parsed.data.audience, userId: parsed.data.userId, title: parsed.data.title, body: parsed.data.body, recipientCount },
  });

  return NextResponse.json({ recipientCount });
}
