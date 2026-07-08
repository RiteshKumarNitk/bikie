import { NextResponse } from "next/server";
import { getServerSession } from "./get-session";

export async function requireSession() {
  const session = await getServerSession();
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireRole(role: string | string[]) {
  const session = await getServerSession();
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(session.user.role as string)) {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, error: null };
}
