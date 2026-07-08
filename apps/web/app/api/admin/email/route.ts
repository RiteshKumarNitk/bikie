import { NextResponse } from "next/server";
import { requireRole } from "@/lib/require-role";
import { EmailService } from "@bikie/services";

export async function POST(request: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await request.json();
  await EmailService.send({ to: body.to, subject: body.subject, html: body.html });
  return NextResponse.json({ success: true });
}