import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { createBikeSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function POST(request: Request) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const parsed = createBikeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const bike = await AdminService.createBike(parsed.data);
  await logAdminAction({
    userId: session.user.id,
    action: "CREATE_BIKE",
    entity: "Bike",
    entityId: bike.id,
  });
  return NextResponse.json({ bike });
}