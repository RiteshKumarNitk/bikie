import { NextResponse } from "next/server";
import { getCommunityModule } from "@bikie/services";
import { createGroupSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/** Discovery — PUBLIC groups only, unconditionally, regardless of who's asking. Private groups
 * never appear in this list; see CommunityRepositoryPort.findPublicGroups's own doc comment. */
export async function GET(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const type = searchParams.get("type");
  const city = searchParams.get("city") ?? undefined;

  const groups = await getCommunityModule().community.discoverGroups({
    search,
    type: type === "COMMUNITY" || type === "CLUB" ? type : undefined,
    city,
  });
  return NextResponse.json({ groups });
}

/** The creator becomes OWNER with an approved membership atomically — see
 * CommunityRepositoryPort.createOwnGroup's doc comment. */
export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = createGroupSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const group = await getCommunityModule().community.createGroup(session.user.id, parsed.data);
  return NextResponse.json({ group }, { status: 201 });
}
