import { NextResponse } from "next/server";
import { AdminService, BikeService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

/** A partner removing their own bike — ownership-checked against `BikeService.getByOwner`
 * before reusing `AdminService.deleteBike` (the same deletion logic the ADMIN-only route uses).
 * The Fleet page previously called the ADMIN-only `/api/admin/bikes/[id]` DELETE directly, which
 * 403'd for a real partner — same root cause as the missing POST route. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("PARTNER");
  if (error) return error;

  const { id } = await params;
  const myBikes = await BikeService.getByOwner(session.user.id);
  if (!myBikes.some((b) => b.id === id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await AdminService.deleteBike(id);
  return NextResponse.json({ success: true });
}
