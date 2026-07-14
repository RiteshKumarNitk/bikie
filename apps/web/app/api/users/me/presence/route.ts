import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-role";
import { prisma } from "@bikie/database";

export async function POST() {
  const { session, error } = await requireSession();
  if (error) return error;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastActiveAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
