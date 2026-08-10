import { NextResponse } from "next/server";
import { AdminService, BikeService } from "@bikie/services";
import { createBikeSchema } from "@bikie/validation";
import { requirePartnerCapability } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requirePartnerCapability();
  if (error) return error;

  const bikes = await BikeService.getByOwner(session.user.id);
  return NextResponse.json({ bikes });
}

/**
 * A partner listing their own bike — reuses `AdminService.createBike` (the same creation logic
 * `POST /api/admin/bikes` calls), just gated by PARTNER instead of ADMIN and with `ownerId`
 * always forced to the caller's own session rather than trusted from the request body. Fixes a
 * real pre-existing gap: the partner Fleet page previously posted straight to the ADMIN-only
 * `/api/admin/bikes`, so a real (non-admin) partner got a 403 trying to add a bike at all.
 */
export async function POST(request: Request) {
  const { session, error } = await requirePartnerCapability();
  if (error) return error;

  const parsed = createBikeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const bike = await AdminService.createBike({ ...parsed.data, ownerId: session.user.id });
  return NextResponse.json({ bike }, { status: 201 });
}
