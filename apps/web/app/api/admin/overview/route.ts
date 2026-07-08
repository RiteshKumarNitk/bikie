import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const stats = await AdminService.getOverviewStats();
  return NextResponse.json({ stats });
}
