import { NextResponse } from "next/server";
import { WishlistService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function POST(_request: Request, { params }: { params: Promise<{ bikeId: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { bikeId } = await params;
  await WishlistService.add(session.user.id, bikeId);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ bikeId: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { bikeId } = await params;
  await WishlistService.remove(session.user.id, bikeId);
  return NextResponse.json({ success: true });
}
