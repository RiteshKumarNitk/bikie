import { NextResponse } from "next/server";
import { LegalService } from "@bikie/services";
import { acceptLegalVersionsSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/** ADR-090 — an existing user explicitly accepts newly published legal versions (re-consent).
 * Appends new acceptance rows; earlier acceptances are never touched. Only *current* published
 * versions are accepted — anything else is 409 so the client re-fetches and shows the new text. */
export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = acceptLegalVersionsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await LegalService.acceptCurrent({
    userId: session.user.id,
    versionIds: parsed.data.versionIds,
    accountType: session.user.accountType === "SERVICE_PROVIDER" ? "SERVICE_PROVIDER" : "RIDER",
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent"),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.code, message: result.message }, { status: 409 });
  }
  return NextResponse.json({ success: true, recorded: result.recorded });
}
