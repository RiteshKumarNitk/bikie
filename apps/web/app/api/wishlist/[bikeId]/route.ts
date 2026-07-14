import { NextResponse } from "next/server";
import { WishlistService } from "@bikie/services";
import { wishlistBikeIdSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

export async function POST(_request: Request, { params }: { params: Promise<{ bikeId: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = wishlistBikeIdSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await WishlistService.add(session.user.id, parsed.data.bikeId);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ bikeId: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = wishlistBikeIdSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await WishlistService.remove(session.user.id, parsed.data.bikeId);
  return NextResponse.json({ success: true });
}
