import { NextResponse } from "next/server";
import { WishlistService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const items = await WishlistService.getForUser(session.user.id);
  return NextResponse.json({ items });
}
