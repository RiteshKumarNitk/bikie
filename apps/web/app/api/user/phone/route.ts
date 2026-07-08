import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-role";
import { prisma } from "@bikie/database";

export async function PATCH(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await request.json();
  if (typeof body.phone !== "string") {
    return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone: body.phone || null },
  });

  return NextResponse.json({ success: true });
}