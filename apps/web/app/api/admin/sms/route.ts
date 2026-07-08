import { NextResponse } from "next/server";
import { requireRole } from "@/lib/require-role";
import { SMSService } from "@bikie/services";

export async function POST(request: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await request.json();
  await SMSService.send(body.to, body.message);
  return NextResponse.json({ success: true });
}