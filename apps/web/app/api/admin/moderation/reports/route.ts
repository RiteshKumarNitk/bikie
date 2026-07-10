import { NextResponse } from "next/server";
import { ReportService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

export async function GET(request: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const targetType = url.searchParams.get("targetType") ?? undefined;

  const reports = await ReportService.list({ status, targetType });
  return NextResponse.json({ reports });
}
