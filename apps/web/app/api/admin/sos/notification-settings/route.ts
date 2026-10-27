import { NextResponse } from "next/server";
import { SOSService } from "@bikie/services";
import { sosNotificationSettingsUpdateSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

/**
 * Admin global on/off per channel for SOS dispatch (push + SMS only — WhatsApp/email aren't
 * admin-controllable, see channel-selection.ts). Gates ONLY the SOS fan-out/escalation code
 * paths — never the shared FCM/MSG91 infrastructure every other notification type also uses.
 */
export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const settings = await SOSService.getNotificationSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const parsed = sosNotificationSettingsUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const settings = await SOSService.updateNotificationSettings(parsed.data, session.user.id);

  await logAdminAction({
    userId: session.user.id,
    action: "UPDATE_SOS_NOTIFICATION_SETTINGS",
    entity: "SosNotificationSettings",
    metadata: { ...parsed.data },
  });

  return NextResponse.json({ settings });
}
