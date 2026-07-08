import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function POST(request: Request) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await request.json();
  const bike = await AdminService.createBike(body);
  await logAdminAction({
    userId: session.user.id,
    action: "CREATE_BIKE",
    entity: "Bike",
    entityId: bike.id,
  });
  return NextResponse.json({ bike });
}