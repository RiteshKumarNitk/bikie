import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const groups = await AdminService.getAllGroups();
  return NextResponse.json({ groups });
}

export async function POST(request: Request) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await request.json();
  const group = await AdminService.createGroup({
    name: body.name,
    description: body.description,
    imageUrl: body.imageUrl,
    type: body.type,
    city: body.city || undefined,
    isPrivate: Boolean(body.isPrivate),
    ownerId: body.ownerId,
  });
  await logAdminAction({
    userId: session.user.id,
    action: "CREATE_GROUP",
    entity: "Group",
    entityId: group.id,
  });
  return NextResponse.json({ group });
}
