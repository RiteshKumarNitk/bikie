import { NextResponse } from "next/server";
import { RiderProfileService } from "@bikie/services";
import { riderProfileSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const [profile, needsOnboarding] = await Promise.all([
    RiderProfileService.getMine(session.user.id),
    RiderProfileService.needsOnboarding(session.user.id),
  ]);
  return NextResponse.json({ profile, needsOnboarding });
}

export async function PUT(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = riderProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await RiderProfileService.saveMine(session.user.id, parsed.data);
  return NextResponse.json({ profile });
}
