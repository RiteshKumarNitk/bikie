import { NextResponse } from "next/server";
import { ModerationService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

export async function GET(request: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1") || 1;
  const result = await ModerationService.listConversations(page);
  return NextResponse.json(result);
}
